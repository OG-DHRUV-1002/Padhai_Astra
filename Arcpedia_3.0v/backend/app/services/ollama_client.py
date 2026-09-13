"""
Ollama client — production-ready async HTTP wrapper for the local Ollama API.

Provides:
- Text generation (blocking and streaming)
- Embedding generation (single and batched)
- Ollama chat API with conversation history
- Health checks and model listing

All methods include robust error handling for the case where
Ollama is not running or the requested model is not available.
"""

import json
import logging
from typing import AsyncIterator, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class OllamaConnectionError(Exception):
    """Raised when Ollama is unreachable at the configured URL."""
    pass


class OllamaModelNotFoundError(Exception):
    """Raised when the requested model is not pulled/available in Ollama."""
    pass


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class OllamaClient:
    """
    Async client for the Ollama REST API.

    Wraps /api/generate, /api/chat, /api/embeddings, and /api/tags
    with proper error handling, timeouts, and streaming support.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        embed_model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or settings.ollama_model
        self.embed_model = embed_model or settings.ollama_embed_model
        self.timeout = timeout or settings.ollama_timeout

        # Two clients: one for regular requests, one for streaming
        # (streaming needs a longer read timeout)
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout),
        )
        self._stream_client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,     # streaming can take a long time
                write=10.0,
                pool=10.0,
            ),
        )

    # ------------------------------------------------------------------
    # Error handling helpers
    # ------------------------------------------------------------------

    def _handle_connection_error(self, err: Exception) -> None:
        """Wrap connection errors with a clear message."""
        raise OllamaConnectionError(
            f"Cannot reach Ollama at {self.base_url}. "
            f"Is Ollama running? Start it with: ollama serve\n"
            f"Original error: {err}"
        ) from err

    def _check_model_error(self, response: httpx.Response, model: str) -> None:
        """Check if a 404 response indicates a missing model."""
        if response.status_code == 404:
            raise OllamaModelNotFoundError(
                f"Model '{model}' not found in Ollama. "
                f"Pull it with: ollama pull {model}"
            )

    # ------------------------------------------------------------------
    # Text Generation (blocking)
    # ------------------------------------------------------------------

    async def generate(
        self,
        prompt: str,
        *,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """
        Generate text via Ollama's /api/generate endpoint.

        Returns the full response text as a single string.
        Use generate_stream() for token-by-token streaming.

        Args:
            prompt:      The user prompt to send to the model.
            system:      Optional system prompt for instruction tuning.
            model:       Override the default model (e.g. "gemma2:9b").
            temperature: Sampling temperature (0.0 = deterministic).
            max_tokens:  Maximum number of tokens to generate.

        Raises:
            OllamaConnectionError:   If Ollama is not reachable.
            OllamaModelNotFoundError: If the model is not available.
            httpx.HTTPStatusError:    On other HTTP errors.
        """
        target_model = model or self.model
        payload: dict = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system:
            payload["system"] = system

        try:
            response = await self._client.post("/api/generate", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

        self._check_model_error(response, target_model)
        response.raise_for_status()
        return response.json().get("response", "")

    # ------------------------------------------------------------------
    # Text Generation (streaming)
    # ------------------------------------------------------------------

    async def generate_stream(
        self,
        prompt: str,
        *,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Stream text generation token-by-token via Ollama's /api/generate.

        Yields individual text fragments as they arrive from the model.
        The caller should concatenate them to build the full response.

        Example:
            async for token in client.generate_stream("Explain RAG"):
                print(token, end="", flush=True)

        Raises:
            OllamaConnectionError:   If Ollama is not reachable.
            OllamaModelNotFoundError: If the model is not available.
        """
        target_model = model or self.model
        payload: dict = {
            "model": target_model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system:
            payload["system"] = system

        try:
            async with self._stream_client.stream(
                "POST", "/api/generate", json=payload
            ) as response:
                # Check for model-not-found before reading the stream body
                if response.status_code == 404:
                    # Need to read body to get error details
                    await response.aread()
                    raise OllamaModelNotFoundError(
                        f"Model '{target_model}' not found. "
                        f"Pull it with: ollama pull {target_model}"
                    )
                response.raise_for_status()

                # Ollama streams newline-delimited JSON objects
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        logger.warning("Skipping malformed stream line: %s", line[:100])
                        continue

                    # Yield the text fragment; "response" key holds each token
                    text = chunk.get("response", "")
                    if text:
                        yield text

                    # If Ollama signals done, stop iterating
                    if chunk.get("done", False):
                        return

        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

    # ------------------------------------------------------------------
    # Chat API (with conversation history)
    # ------------------------------------------------------------------

    async def chat(
        self,
        messages: list[dict],
        *,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """
        Send a multi-turn conversation to Ollama's /api/chat endpoint.

        Args:
            messages: List of {"role": "user"|"assistant"|"system", "content": "..."}
            model:    Override model name.

        Returns the assistant's reply as a string.
        """
        target_model = model or self.model
        payload = {
            "model": target_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        try:
            response = await self._client.post("/api/chat", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

        self._check_model_error(response, target_model)
        response.raise_for_status()
        return response.json().get("message", {}).get("content", "")

    async def chat_stream(
        self,
        messages: list[dict],
        *,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Stream a multi-turn conversation token-by-token.

        Yields text fragments from the assistant's response.
        """
        target_model = model or self.model
        payload = {
            "model": target_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        try:
            async with self._stream_client.stream(
                "POST", "/api/chat", json=payload
            ) as response:
                if response.status_code == 404:
                    await response.aread()
                    raise OllamaModelNotFoundError(
                        f"Model '{target_model}' not found. "
                        f"Pull it with: ollama pull {target_model}"
                    )
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    text = chunk.get("message", {}).get("content", "")
                    if text:
                        yield text

                    if chunk.get("done", False):
                        return

        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

    # ------------------------------------------------------------------
    # Embeddings
    # ------------------------------------------------------------------

    async def embed(
        self,
        text: str,
        *,
        model: Optional[str] = None,
    ) -> list[float]:
        """
        Generate an embedding vector for a single text string.

        Returns the embedding as a list of floats.

        Raises:
            OllamaConnectionError:   If Ollama is not reachable.
            OllamaModelNotFoundError: If the embed model is not pulled.
        """
        target_model = model or self.embed_model
        payload = {
            "model": target_model,
            "prompt": text,
        }
        try:
            response = await self._client.post("/api/embeddings", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

        self._check_model_error(response, target_model)
        response.raise_for_status()
        return response.json().get("embedding", [])

    async def embed_batch(
        self,
        texts: list[str],
        *,
        model: Optional[str] = None,
        batch_size: Optional[int] = None,
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts, processing in batches.

        This is critical for ingestion performance — Ollama's /api/embeddings
        only accepts one text at a time, so we parallelise within batches
        to avoid overwhelming the GPU while still being faster than sequential.

        Args:
            texts:      List of text strings to embed.
            model:      Override the embedding model.
            batch_size: Number of concurrent embedding requests per batch.
                        Defaults to settings.ollama_embed_batch_size.

        Returns:
            List of embedding vectors in the same order as the input texts.
        """
        import asyncio

        _batch_size = batch_size or settings.ollama_embed_batch_size
        target_model = model or self.embed_model
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), _batch_size):
            batch = texts[i : i + _batch_size]
            logger.info(
                "Embedding batch %d–%d of %d texts",
                i + 1, min(i + _batch_size, len(texts)), len(texts),
            )

            # Fire all requests in this batch concurrently
            tasks = [self.embed(text, model=target_model) for text in batch]
            batch_results = await asyncio.gather(*tasks)
            all_embeddings.extend(batch_results)

        return all_embeddings

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    async def list_models(self) -> list[dict]:
        """List all models currently available in Ollama."""
        try:
            response = await self._client.get("/api/tags")
            response.raise_for_status()
            return response.json().get("models", [])
        except (httpx.ConnectError, httpx.ConnectTimeout) as err:
            self._handle_connection_error(err)

    async def health(self) -> bool:
        """
        Check if Ollama is reachable.

        Returns True if the server responds, False otherwise.
        Does not raise exceptions.
        """
        try:
            response = await self._client.get("/")
            return response.status_code == 200
        except (httpx.HTTPError, Exception):
            return False

    async def close(self) -> None:
        """Shut down both underlying HTTP clients."""
        await self._client.aclose()
        await self._stream_client.aclose()
        logger.info("OllamaClient connections closed.")


# ---------------------------------------------------------------------------
# Convenience singleton — import `ollama_client` anywhere in the app
# ---------------------------------------------------------------------------
ollama_client = OllamaClient()
