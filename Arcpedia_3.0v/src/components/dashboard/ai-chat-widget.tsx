"use client";

import * as React from "react";
import { Send, Sparkles, X, Minimize2, Maximize2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { chatStream } from "@/lib/rag/client";
import { ChatMessage, StreamChunk } from "@/lib/rag/types";
import { useStudent } from "@/context/student-context";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface Message extends ChatMessage {
    id: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export function AIChatWidget() {
    const { studentData } = useStudent();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm Archi, your local AI academic assistant. How can I help you optimize your studies today?",
            timestamp: new Date(),
        },
    ]);
    const [isTyping, setIsTyping] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    
    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    // GSAP Open/Close Animation
    useGSAP(() => {
        if (!containerRef.current) return;
        
        const popup = containerRef.current.querySelector('.chat-popup');
        
        if (isOpen) {
            gsap.fromTo(popup, 
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)", display: 'flex' }
            );
        } else {
            gsap.to(popup, {
                opacity: 0, y: 30, scale: 0.95, duration: 0.3, ease: "power2.in",
                onComplete: () => {
                    if (popup) (popup as HTMLElement).style.display = 'none';
                }
            });
        }
    }, { dependencies: [isOpen], scope: containerRef });

    // GSAP Message Entrance Animation
    useGSAP(() => {
        const newMessage = document.querySelectorAll('.message-item:not(.animated)');
        if (newMessage.length > 0) {
            gsap.fromTo(newMessage, 
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.1, ease: "power2.out" }
            );
            newMessage.forEach(el => el.classList.add('animated'));
        }
    }, { dependencies: [messages], scope: containerRef });

    // GSAP Typing/Thinking Animation
    useGSAP(() => {
        if (isTyping) {
            gsap.to('.typing-dot', {
                y: -5,
                duration: 0.4,
                stagger: 0.15,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });
        }
    }, { dependencies: [isTyping], scope: containerRef });


    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);

        const aiMsgId = (Date.now() + 1).toString();
        
        // Add placeholder for streaming response
        setMessages(prev => [...prev, {
            id: aiMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true
        }]);

        try {
            // Prepare history for API
            const apiMessages = newMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const tenantId = studentData?.uid || "anonymous_student";

            // Trigger the streaming RAG API
            await chatStream(
                { 
                    messages: apiMessages, 
                    tenant_id: tenantId, 
                    use_rag: true // Enable RAG context retrieval 
                },
                (chunk: StreamChunk) => {
                    if (chunk.error) {
                        setMessages(prev => prev.map(m => 
                            m.id === aiMsgId ? { ...m, content: chunk.error!, isStreaming: false } : m
                        ));
                        return;
                    }

                    if (chunk.done) {
                        setMessages(prev => prev.map(m => 
                            m.id === aiMsgId ? { ...m, isStreaming: false } : m
                        ));
                        return;
                    }

                    // Append text fragment to the streaming message
                    setMessages(prev => prev.map(m => 
                        m.id === aiMsgId ? { ...m, content: m.content + chunk.content } : m
                    ));
                    
                    // Scroll to bottom as new text streams in
                    scrollToBottom();
                }
            );

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { 
                    ...m, 
                    content: "I'm having trouble connecting to my local neural core right now. Please try again in a moment.", 
                    isStreaming: false 
                } : m
            ));
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div ref={containerRef} className="fixed top-24 right-6 z-50 flex flex-col items-end pointer-events-none">
            
            {/* The Chat Popup Window */}
            <div className="chat-popup pointer-events-auto mt-4 origin-top-right hidden">
                <Card className={cn(
                    "flex flex-col h-full overflow-hidden border-2 shadow-2xl glass dark:glass-dark transition-all duration-300",
                    isTyping ? "border-indigo-500/50 shadow-indigo-500/20" : "border-primary/20",
                    isExpanded ? "w-[90vw] md:w-[600px] h-[80vh]" : "w-[90vw] md:w-[380px] h-[500px]"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm">Archi Assistant</h3>
                                <span className="text-[10px] text-primary flex items-center gap-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Local Secure Mode
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30 custom-scrollbar">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "message-item flex gap-3 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <Avatar className={cn(
                                    "h-8 w-8 border shrink-0",
                                    msg.role === "assistant" ? "bg-indigo-500/20 border-indigo-500/30" : "bg-muted border-white/10"
                                )}>
                                    <AvatarFallback className={msg.role === "assistant" ? "bg-indigo-500 text-white" : "bg-muted-foreground/20"}>
                                        {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm relative",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-sm"
                                        : "bg-white/10 backdrop-blur-md border border-white/10 text-foreground rounded-tl-sm",
                                    msg.isStreaming && "border-indigo-500/30 shadow-indigo-500/10"
                                )}>
                                    {/* Streaming glowing border effect */}
                                    {msg.isStreaming && (
                                        <div className="absolute inset-0 rounded-2xl rounded-tl-sm border border-indigo-400 animate-pulse opacity-50 pointer-events-none" />
                                    )}

                                    {msg.role === "user" ? (
                                        msg.content
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Render streaming cursor */}
                                            {msg.isStreaming && !msg.content && (
                                                <div className="flex gap-1 items-center h-4">
                                                    <span className="typing-dot w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                    <span className="typing-dot w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                    <span className="typing-dot w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                </div>
                                            )}
                                            
                                            {msg.content.split('\n').map((line, i) => {
                                                if (!line.trim()) return <div key={i} className="h-2" />;
                                                const isList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                                                const cleanLine = isList ? line.trim().substring(2) : line;
                                                const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={j} className="font-bold text-indigo-700 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
                                                    }
                                                    return part;
                                                });
                                                return (
                                                    <div key={i} className={cn(isList && "ml-4 flex gap-2 items-start")}>
                                                        {isList && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-70" />}
                                                        <p className={cn("leading-relaxed", isList && "flex-1")}>{parts}</p>
                                                    </div>
                                                );
                                            })}
                                            {/* Streaming cursor block */}
                                            {msg.isStreaming && msg.content && (
                                                <span className="inline-block w-2 h-4 ml-1 align-middle bg-indigo-500/70 animate-pulse" />
                                            )}
                                        </div>
                                    )}
                                    <span className="text-[10px] opacity-50 block mt-1 text-right">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background/50 border-t border-white/10 backdrop-blur-md">
                        <div className="relative flex items-center gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Archi anything..."
                                className="pr-12 bg-white/5 border-white/10 focus-visible:ring-indigo-500/50 text-base"
                                disabled={isTyping}
                            />
                            <Button
                                size="icon"
                                className={cn(
                                    "absolute right-1 w-8 h-8 rounded-lg transition-colors",
                                    isTyping ? "bg-slate-500" : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                        <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground/70">
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> Local Gemma 2</span>
                            <span>🔒 100% Private</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                className={cn(
                    "pointer-events-auto flex items-center justify-center p-4 rounded-full shadow-2xl transition-colors duration-300",
                    isOpen ? "bg-muted text-foreground" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
                ) : (
                    <Bot className="h-8 w-8 transition-transform duration-300" />
                )}
            </button>
        </div>
    );
}
