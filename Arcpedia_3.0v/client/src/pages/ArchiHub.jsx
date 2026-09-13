import React, { useState, useRef, useEffect } from 'react';
import { Search, RotateCcw, ArrowLeft, ArrowRight, Lock, Image as ImageIcon, Sparkles, Send, Mic, Play, FileText, Globe } from 'lucide-react';
import { ArchiService } from '../services/ArchiService';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

const ArchiHub = () => {
    const [activeMainTab, setActiveMainTab] = useState("Search"); // "Search" or "Chat"

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Chat State
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // --- Search Logic ---
    const handleSearch = async (overrideQuery) => {
        const queryToUse = overrideQuery || searchQuery;
        if (!queryToUse.trim()) return;

        setSearchQuery(queryToUse);
        setIsSearching(true);
        setHasSearched(true);
        setSearchResults(null);

        const results = await ArchiService.searchAsync(queryToUse);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleSearchKeyUp = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- Chat Logic ---
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isTyping) return;

        const userMsg = { role: 'user', content: chatInput, timestamp: new Date() };
        setChatHistory(prev => [...prev, userMsg]);

        const currentInput = chatInput;
        setChatInput("");
        setIsTyping(true);

        const response = await ArchiService.getChatResponseAsync(currentInput, chatHistory);

        setIsTyping(false);
        setChatHistory(prev => [...prev, { role: 'ai', content: response, timestamp: new Date() }]);
    };

    const handleChatKeyUp = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isTyping, activeMainTab]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white font-sans text-gray-800">
            {/* Header / Mode Switcher */}
            <header className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="flex items-center gap-6">
                    <span className={`cursor-pointer pb-1 border-b-2 font-medium text-sm ${activeMainTab === 'Search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-black'}`} onClick={() => setActiveMainTab("Search")}>
                        Search
                    </span>
                    <span className={`cursor-pointer pb-1 border-b-2 font-medium text-sm ${activeMainTab === 'Chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-black'}`} onClick={() => setActiveMainTab("Chat")}>
                        Gemini (Archi Chat)
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Grid3x3 size={20} className="text-gray-500 cursor-pointer hover:bg-gray-100 rounded-full p-1" />
                    <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm">
                        A
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">

                {/* --- GOOGLE SEARCH CLONE --- */}
                {activeMainTab === "Search" && (
                    <div className="h-full overflow-y-auto">
                        {!hasSearched ? (
                            <div className="flex flex-col items-center justify-center h-full -mt-16">
                                {/* Logo */}
                                <div className="flex items-center text-[5.5rem] font-bold tracking-tighter mb-8 select-none">
                                    <span className="text-[#4285F4]">A</span>
                                    <span className="text-[#EA4335]">r</span>
                                    <span className="text-[#FBBC05]">c</span>
                                    <span className="text-[#4285F4]">h</span>
                                    <span className="text-[#34A853]">i</span>
                                </div>

                                {/* Search Bar */}
                                <div className="w-full max-w-[584px] px-4 relative group">
                                    <div className="flex items-center w-full h-[46px] rounded-[24px] border border-gray-200 px-4 hover:shadow-md hover:border-gray-300 focus-within:shadow-md transition-shadow bg-white">
                                        <Search className="text-gray-400 mr-3" size={20} />
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyUp={handleSearchKeyUp}
                                            className="flex-1 outline-none text-[16px] text-black"
                                            autoFocus
                                        />
                                        <Mic className="text-[#4285F4] ml-3 cursor-pointer" size={20} />
                                        <ImageIcon className="text-[#4285F4] ml-3 cursor-pointer" size={20} />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="mt-8 flex gap-3">
                                    <button onClick={() => handleSearch()} className="bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-xs text-[#3c4043] px-4 py-2 text-sm rounded-[4px] font-medium transition-all">
                                        Archi Search
                                    </button>
                                    <button className="bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-xs text-[#3c4043] px-4 py-2 text-sm rounded-[4px] font-medium transition-all">
                                        I'm Feeling Lucky
                                    </button>
                                </div>

                                {/* Language */}
                                <div className="mt-6 text-sm text-[#3c4043]">
                                    Archi offered in: <a href="#" className="text-[#1a0dab] hover:underline ml-1">Hindi</a> <a href="#" className="text-[#1a0dab] hover:underline ml-1">Bengali</a> <a href="#" className="text-[#1a0dab] hover:underline ml-1">Telugu</a> <a href="#" className="text-[#1a0dab] hover:underline ml-1">Marathi</a>
                                </div>
                            </div>
                        ) : (
                            // Search Results Page
                            <div className="bg-white min-h-full">
                                {/* Results Header */}
                                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-[180px] py-6 z-10 flex gap-4 items-center">
                                    <div className="flex items-center text-2xl font-bold tracking-tight cursor-pointer mr-6" onClick={() => { setHasSearched(false); setSearchQuery(''); }}>
                                        <span className="text-[#4285F4]">A</span>
                                        <span className="text-[#EA4335]">r</span>
                                        <span className="text-[#FBBC05]">c</span>
                                        <span className="text-[#4285F4]">h</span>
                                        <span className="text-[#34A853]">i</span>
                                    </div>
                                    <div className="flex-1 max-w-[690px] relative">
                                        <div className="flex items-center w-full h-[44px] rounded-[24px] shadow-sm border border-transparent hover:shadow-md bg-white px-5 ring-1 ring-gray-200">
                                            <input
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyUp={handleSearchKeyUp}
                                                className="flex-1 outline-none text-[16px] text-black border-r border-gray-300 pr-3 mr-3"
                                            />
                                            <Mic className="text-[#4285F4] cursor-pointer mr-3" size={20} />
                                            <Search className="text-[#4285F4] cursor-pointer" size={20} onClick={() => handleSearch()} />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 md:px-[180px] py-3 border-b border-gray-100 flex gap-6 text-sm text-gray-500">
                                    <span className="text-[#1a0dab] font-medium pb-3 border-b-[3px] border-[#1a0dab] cursor-pointer">All</span>
                                    <span className="hover:text-[#1a0dab] cursor-pointer">Images</span>
                                    <span className="hover:text-[#1a0dab] cursor-pointer">Videos</span>
                                    <span className="hover:text-[#1a0dab] cursor-pointer">News</span>
                                    <span className="hover:text-[#1a0dab] cursor-pointer">Books</span>
                                </div>

                                {/* Results List */}
                                <div className="px-4 md:px-[180px] py-4 max-w-[800px]">
                                    <div className="text-gray-500 text-sm mb-4">
                                        About {searchResults?.length || 0} results (0.42 seconds)
                                    </div>

                                    {isSearching ? (
                                        <div className="space-y-8">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="animate-pulse">
                                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                                                    <div className="h-16 bg-gray-200 rounded w-full"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {searchResults?.map((result, idx) => (
                                                <div key={idx} className="group">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500 uppercase overflow-hidden">
                                                            {result.thumbnailUrl ? <img src={result.thumbnailUrl} className="w-full h-full object-cover" /> : <Globe size={14} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-[#202124]">{new URL(result.url || 'https://google.com').hostname}</span>
                                                            <span className="text-xs text-gray-500">{result.url}</span>
                                                        </div>
                                                    </div>
                                                    <a href={result.url} target="_blank" rel="noreferrer" className="block group-hover:underline">
                                                        <h3 className="text-xl text-[#1a0dab] font-normal truncate">{result.title}</h3>
                                                    </a>
                                                    <p className="text-sm text-[#4d5156] mt-1 leading-relaxed">
                                                        {result.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- GEMINI CHAT CLONE --- */}
                {activeMainTab === "Chat" && (
                    <div className="flex h-full bg-white">
                        {/* Sidebar */}
                        <div className="w-[260px] bg-[#f0f4f9] hidden md:flex flex-col p-3">
                            <div className="mb-4">
                                <button onClick={() => setChatHistory([])} className="flex items-center gap-2 bg-[#dde3ea] hover:bg-[#cacee2] text-[#444746] px-4 py-2.5 rounded-full text-sm font-medium transition-colors w-fit">
                                    <span className="text-xl">+</span> New chat
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <div className="text-sm font-medium text-[#444746] mb-2 px-2">Recent</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#e0e4e9] text-[#444746] text-sm cursor-pointer truncate">
                                        <History size={14} />
                                        Quantum Physics...
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#e0e4e9] text-[#444746] text-sm cursor-pointer truncate">
                                        <History size={14} />
                                        Calculus Help...
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-[#c7c7c7] text-xs text-[#444746] flex flex-col gap-2 px-2">
                                <div className="flex items-center gap-2 cursor-pointer hover:bg-[#e0e4e9] p-2 rounded"><span className="w-2 h-2 rounded-full bg-green-500"></span> Archi Advanced</div>
                                <div className="flex items-center gap-2 cursor-pointer hover:bg-[#e0e4e9] p-2 rounded">Settings</div>
                            </div>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col items-center relative">
                            {/* Gemini Header */}
                            <div className="w-full p-4 flex justify-between items-center text-[#444746] md:hidden">
                                <span>Gemini</span>
                                <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">A</div>
                            </div>

                            <div className="flex-1 w-full max-w-[800px] overflow-y-auto p-4 scroll-smooth pb-32">
                                {chatHistory.length === 0 ? (
                                    <div className="mt-12 md:mt-24">
                                        <h1 className="text-[3.5rem] leading-tight font-medium mb-2 bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-transparent">Hello, Student</h1>
                                        <p className="text-[3.5rem] leading-tight font-medium text-[#c4c7c5] mb-12">How can I help you today?</p>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {[
                                                { icon: <PenTool size={20} />, text: "Write an email to my professor" },
                                                { icon: <Lightbulb size={20} />, text: "Explain thermodynamics simply" },
                                                { icon: <Globe size={20} />, text: "Plan a study schedule" },
                                                { icon: <FileText size={20} />, text: "Summarize this article" },
                                            ].map((suggestion, i) => (
                                                <div key={i} onClick={() => setChatInput(suggestion.text)} className="bg-[#f0f4f9] hover:bg-[#dde3ea] p-4 rounded-xl cursor-pointer h-[200px] flex flex-col justify-between transition-colors">
                                                    <div className="text-[#444746]">{suggestion.text}</div>
                                                    <div className="self-end bg-white p-2 rounded-full">{suggestion.icon}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 mt-4">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                {msg.role === 'ai' && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] to-[#D96570] flex-shrink-0 flex items-center justify-center text-white text-xs">
                                                        <Sparkles size={16} />
                                                    </div>
                                                )}
                                                <div className={`flex-1 ${msg.role === 'user' ? 'bg-[#f0f4f9] rounded-2xl rounded-tr-none px-5 py-3' : ''}`}>
                                                    <div className="prose prose-slate max-w-none text-[#1f1f1f] text-[16px] leading-7">
                                                        {msg.role === 'user' ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] to-[#D96570] flex-shrink-0 flex items-center justify-center text-white text-xs animate-pulse">
                                                    <Sparkles size={16} />
                                                </div>
                                                <div className="text-sm text-gray-400 mt-2">Thinking...</div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Chat Input Bar */}
                            <div className="absolute bottom-0 w-full bg-white p-4 flex justify-center">
                                <div className="w-full max-w-[800px] bg-[#f0f4f9] rounded-[28px] px-6 py-4 flex items-center gap-4 focus-within:bg-[#eef1f6] transition-colors">
                                    <div className="p-2 hover:bg-[#dce1e9] rounded-full cursor-pointer transition-colors">
                                        <div className="bg-[#444746] rounded-full w-5 h-5 flex items-center justify-center text-white text-xs">+</div>
                                    </div>
                                    <input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyUp={handleChatKeyUp}
                                        placeholder="Enter a prompt here"
                                        className="flex-1 bg-transparent outline-none text-[#1f1f1f] text-base placeholder:text-[#444746]"
                                    />
                                    <div className="flex items-center gap-2 text-[#444746]">
                                        <ImageIcon size={22} className="cursor-pointer hover:text-black" />
                                        <Mic size={22} className="cursor-pointer hover:text-black" />
                                        {chatInput.trim() && (
                                            <button onClick={handleSendMessage} className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                                                <Send size={22} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-1 text-[11px] text-[#444746] pb-1">
                                Archi display accurate info, including about people, so double-check its responses. Your privacy & Archi Apps
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchiHub;
