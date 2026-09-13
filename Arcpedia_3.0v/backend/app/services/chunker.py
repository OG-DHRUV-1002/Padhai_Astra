"""
Text chunker — splits documents into overlapping chunks for embedding.

Uses a recursive strategy:
  1. Try to split on paragraph boundaries (double newline)
  2. Fall back to sentence boundaries (period + space)
  3. Fall back to word boundaries (space)
  4. Last resort: hard character split

Each chunk carries positional metadata (index, start/end character offsets)
so the original document can be reconstructed or the chunk location cited.
"""

import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class TextChunk:
    """A single chunk of text with positional metadata."""
    text: str
    index: int                  # 0-based chunk index within the document
    start_char: int             # character offset in the original document
    end_char: int               # character offset (exclusive)
    metadata: dict = field(default_factory=dict)

    @property
    def char_count(self) -> int:
        return len(self.text)


# ---------------------------------------------------------------------------
# Separators (ordered from coarse to fine)
# ---------------------------------------------------------------------------

# Each separator is tried in order; the first one that produces chunks
# smaller than chunk_size is used.
_SEPARATORS = [
    "\n\n",        # paragraph break
    "\n",          # line break
    ". ",          # sentence boundary
    "? ",          # question boundary
    "! ",          # exclamation boundary
    "; ",          # semicolon
    ", ",          # comma
    " ",           # word boundary
    "",            # character-level (last resort)
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def chunk_text(
    text: str,
    *,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
    extra_metadata: Optional[dict] = None,
) -> list[TextChunk]:
    """
    Split text into overlapping chunks suitable for embedding.

    Algorithm:
      - Recursively split on the coarsest separator that yields
        sub-strings shorter than chunk_size.
      - Merge adjacent short splits up to chunk_size.
      - Apply overlap by carrying trailing characters from the
        previous chunk into the start of the next.

    Args:
        text:            The full document text to split.
        chunk_size:      Target maximum characters per chunk.
                         Defaults to settings.rag_default_chunk_size.
        chunk_overlap:   Number of characters to overlap between chunks.
                         Defaults to settings.rag_default_chunk_overlap.
        extra_metadata:  Optional dict merged into every chunk's metadata.

    Returns:
        List of TextChunk objects in document order.
    """
    _chunk_size = chunk_size or settings.rag_default_chunk_size
    _chunk_overlap = chunk_overlap or settings.rag_default_chunk_overlap

    # Guard: overlap must be smaller than chunk size
    if _chunk_overlap >= _chunk_size:
        _chunk_overlap = _chunk_size // 4
        logger.warning(
            "Chunk overlap >= chunk size; reducing overlap to %d", _chunk_overlap
        )

    # Clean the input
    text = text.strip()
    if not text:
        return []

    # If the entire text fits in one chunk, return it directly
    if len(text) <= _chunk_size:
        return [
            TextChunk(
                text=text,
                index=0,
                start_char=0,
                end_char=len(text),
                metadata=dict(extra_metadata or {}),
            )
        ]

    # ── Step 1: Recursive split ──────────────────────────────────────
    raw_splits = _recursive_split(text, _chunk_size, _SEPARATORS)

    # ── Step 2: Merge short splits ───────────────────────────────────
    merged = _merge_splits(raw_splits, _chunk_size)

    # ── Step 3: Apply overlap ────────────────────────────────────────
    chunks: list[TextChunk] = []
    char_offset = 0

    for i, segment in enumerate(merged):
        # For chunks after the first, prepend overlap from previous
        if i > 0 and _chunk_overlap > 0:
            prev_text = merged[i - 1]
            overlap_text = prev_text[-_chunk_overlap:]
            segment_with_overlap = overlap_text + segment
        else:
            segment_with_overlap = segment

        chunk = TextChunk(
            text=segment_with_overlap.strip(),
            index=i,
            start_char=max(0, char_offset - (len(segment_with_overlap) - len(segment))),
            end_char=char_offset + len(segment),
            metadata=dict(extra_metadata or {}),
        )
        chunks.append(chunk)
        char_offset += len(segment)

    logger.info(
        "Chunked %d chars into %d chunks (size=%d, overlap=%d)",
        len(text), len(chunks), _chunk_size, _chunk_overlap,
    )
    return chunks


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _recursive_split(
    text: str,
    chunk_size: int,
    separators: list[str],
) -> list[str]:
    """
    Recursively split text on the coarsest separator that works.

    If splitting on the current separator produces fragments that are
    all <= chunk_size, return those. Otherwise, recurse on remaining
    separators for any fragment that's too long.
    """
    if len(text) <= chunk_size:
        return [text]

    # Try each separator in order (coarsest first)
    for sep in separators:
        if sep == "":
            # Character-level split (hard break)
            return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]

        if sep not in text:
            continue

        parts = text.split(sep)
        result: list[str] = []

        for part in parts:
            if len(part) <= chunk_size:
                # Re-attach the separator to keep text natural
                result.append(part + sep if sep.strip() else part)
            else:
                # This part is still too long — recurse with finer separators
                remaining_seps = separators[separators.index(sep) + 1 :]
                sub_parts = _recursive_split(part, chunk_size, remaining_seps)
                result.extend(sub_parts)

        return result

    # Should never reach here, but safety fallback
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def _merge_splits(splits: list[str], chunk_size: int) -> list[str]:
    """
    Merge adjacent short splits until they approach chunk_size.

    This prevents producing many tiny chunks when the text has
    frequent separators (e.g., lots of short paragraphs).
    """
    merged: list[str] = []
    current = ""

    for split in splits:
        candidate = current + split
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                merged.append(current)
            current = split

    if current:
        merged.append(current)

    return merged
