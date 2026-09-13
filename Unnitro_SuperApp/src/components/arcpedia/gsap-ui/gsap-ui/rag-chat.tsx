"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

// Register the GSAP plugin for React
gsap.registerPlugin(useGSAP);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function RagChat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your personalized AI tutor. I can answer questions specifically based on your uploaded study materials. What would you like to learn today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- GSAP ANIMATIONS ---

  // 1. Initial Staggered Layout Entrance
  useGSAP(() => {
    gsap.fromTo(
      ".chat-layout-item",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
    );
  }, { scope: containerRef });

  // 2. New Message Entrance Animation
  useGSAP(() => {
    const unAnimatedMessages = document.querySelectorAll(".message-item:not(.animated)");
    if (unAnimatedMessages.length > 0) {
      gsap.fromTo(
        unAnimatedMessages,
        { opacity: 0, x: (i, el) => (el.classList.contains("user-message") ? 20 : -20), scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 }
      );
      // Mark as animated so we don't re-animate old messages
      unAnimatedMessages.forEach((el) => el.classList.add("animated"));
    }
  }, { dependencies: [messages], scope: containerRef });

  // 3. Subtle Loading/Thinking Indicator
  useGSAP(() => {
    if (isLoading) {
      // Create a smooth pulsing glow effect on the input border when AI is generating
      gsap.to(".loading-indicator", {
        boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
        borderColor: "rgba(99, 102, 241, 0.8)",
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    } else {
      gsap.to(".loading-indicator", {
        boxShadow: "none",
        borderColor: "rgba(226, 232, 240, 1)", // standard slate-200
        duration: 0.3,
      });
    }
  }, { dependencies: [isLoading], scope: containerRef });

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Append user message immediately
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }]);
    setIsLoading(true);

    // Create a placeholder message for the assistant's streaming response
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      // Call the new Groq RAG endpoint
      const response = await fetch("/api/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user_id: "student_test_123", // MOCK TENANT ID AS REQUESTED
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("API route returned an error.");
      }

      // Stream parsing setup
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        if (chunkValue) {
          // Append incoming chunk text to the assistant's message in real-time
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunkValue }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat Streaming Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "I'm having trouble connecting to your knowledge base. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-slate-50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="chat-layout-item flex items-center justify-between p-5 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Knowledge Base Tutor</h2>
            <p className="text-xs text-slate-500 font-medium">Local Multi-Tenant RAG Engine</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="chat-layout-item flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-item flex gap-4 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse user-message" : "mr-auto assistant-message"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                msg.role === "assistant" ? "bg-indigo-500 text-white shadow-md shadow-indigo-200" : "bg-slate-300 text-slate-600"
              }`}
            >
              {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-slate-800 text-white rounded-tr-sm"
                  : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm"
              }`}
            >
              {msg.content ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                /* Blinking cursor while waiting for first chunk */
                <div className="flex items-center h-5">
                  <div className="w-1.5 h-4 bg-indigo-400 animate-pulse rounded-sm"></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="chat-layout-item p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={handleSend}
          className="loading-indicator relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 transition-colors focus-within:bg-white focus-within:border-indigo-300"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your course materials..."
            className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-3 text-[15px] text-slate-800 placeholder:text-slate-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:bg-slate-400 transition-colors mb-0.5 mr-0.5"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            Powered by Groq &bull; Gemma 2 9B &bull; ChromaDB
          </p>
        </div>
      </div>
    </div>
  );
}
