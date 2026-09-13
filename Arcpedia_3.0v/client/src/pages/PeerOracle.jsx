import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Heart,
    User,
    X,
    Send,
    Shield,
    HelpCircle,
    MoreHorizontal
} from 'lucide-react';
import clsx from 'clsx';

const PeerOracle = () => {
    const [showAskDialog, setShowAskDialog] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [newQuestionContent, setNewQuestionContent] = useState("");

    const genericReplies = [
        "I totally relate to this feeling.",
        "You got this! Trust yourself.",
        "Have you tried talking to the professor? They are usually helpful.",
        "Don't worry, everyone starts somewhere.",
        "This too shall pass. Focus on one step at a time.",
        "I felt exactly the same way last year.",
        "Great question! I was wondering the same thing.",
        "You are not alone in this.",
        "Take a deep breath. You are doing fine.",
        "Asking for help is the bravest thing you can do."
    ];

    const generateRandomReplies = (count) => {
        const replies = [];
        for (let i = 0; i < count; i++) {
            replies.push({
                author: "Anonymous Peer",
                content: genericReplies[Math.floor(Math.random() * genericReplies.length)],
                timestamp: `${Math.floor(Math.random() * 60) + 1} min ago`
            });
        }
        return replies;
    };

    useEffect(() => {
        // Initial Mock Data
        setQuestions([
            {
                id: 1,
                content: "I'm genuinely scared to present my final project. I feel like everyone knows more than me. Anyone else feel this way?",
                category: "ImposterSyndrome",
                upvotes: 24,
                isLiked: false,
                replies: generateRandomReplies(3),
                showReplies: false,
                timestamp: "2 hours ago"
            },
            {
                id: 2,
                content: "Is it too late to start learning Java properly in the 3rd year? I cheated my way through 2nd year and now I regret it.",
                category: "Academics",
                upvotes: 45,
                isLiked: false,
                replies: generateRandomReplies(5),
                showReplies: false,
                timestamp: "5 hours ago"
            },
            {
                id: 3,
                content: "How do you handle group partners who don't contribute? I don't want to snitch but I'm doing all the work.",
                category: "Social",
                upvotes: 18,
                isLiked: false,
                replies: generateRandomReplies(2),
                showReplies: false,
                timestamp: "1 day ago"
            },
            {
                id: 4,
                content: "I failed my Data Structures midterm. Is there any hope for passing or should I just drop it now?",
                category: "Academics",
                upvotes: 32,
                isLiked: false,
                replies: generateRandomReplies(6),
                showReplies: false,
                timestamp: "1 day ago"
            }
        ]);
    }, []);

    const toggleLike = (id) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                return {
                    ...q,
                    isLiked: !q.isLiked,
                    upvotes: q.isLiked ? q.upvotes - 1 : q.upvotes + 1
                };
            }
            return q;
        }));
    };

    const toggleReplies = (id) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                return { ...q, showReplies: !q.showReplies };
            }
            return q;
        }));
    };

    const submitQuestion = () => {
        if (!newQuestionContent.trim()) return;

        const newQuestion = {
            id: questions.length + 1,
            content: newQuestionContent,
            category: "General", // Default for now
            upvotes: 0,
            isLiked: false,
            replies: [],
            showReplies: false,
            timestamp: "Just now"
        };

        setQuestions([newQuestion, ...questions]);
        setNewQuestionContent("");
        setShowAskDialog(false);
    };

    const getAvatarBgColor = (id) => {
        const colors = ["bg-blue-400", "bg-purple-400", "bg-indigo-400", "bg-teal-400", "bg-rose-400"];
        return colors[id % colors.length];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 -m-6">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Peer Oracle
                    </h1>
                    <p className="text-slate-500 mt-2">The Anonymous Guidance System. Ask safely, reply kindly.</p>
                </div>
                <button
                    onClick={() => setShowAskDialog(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium"
                >
                    <HelpCircle size={20} />
                    Ask a Question
                </button>
            </div>

            {/* Oracle Feed */}
            <div className="max-w-4xl mx-auto grid gap-6">
                {questions.map((question) => (
                    <div key={question.id} className="group relative bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex gap-4">
                            {/* Abstract Avatar */}
                            <div className={`shrink-0 p-3 rounded-2xl ${getAvatarBgColor(question.id)} flex items-center justify-center w-12 h-12`}>
                                {question.id % 2 === 0 ? (
                                    <User className="text-white" size={24} />
                                ) : (
                                    <Shield className="text-white" size={24} />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-2 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            #{question.category}
                                        </span>
                                        <span className="text-xs text-slate-400 py-1">{question.timestamp}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                <h3 className="text-lg font-semibold text-slate-800 mb-2 leading-relaxed">
                                    {question.content}
                                </h3>

                                <div className="flex items-center gap-6 mt-4 text-slate-500 text-sm">
                                    <button
                                        onClick={() => toggleLike(question.id)}
                                        className={clsx(
                                            "flex items-center gap-1.5 transition-colors",
                                            question.isLiked ? "text-blue-600 font-medium" : "hover:text-blue-600"
                                        )}
                                    >
                                        <Heart size={20} fill={question.isLiked ? "currentColor" : "none"} />
                                        <span>{question.upvotes} Helpful</span>
                                    </button>

                                    <button
                                        onClick={() => toggleReplies(question.id)}
                                        className={clsx(
                                            "flex items-center gap-1.5 transition-colors",
                                            question.showReplies ? "text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full" : "hover:text-purple-600"
                                        )}
                                    >
                                        <MessageSquare size={20} />
                                        <span>{question.replies.length} Replies</span>
                                    </button>
                                </div>

                                {/* Replies List */}
                                {question.showReplies && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        {question.replies.map((reply, index) => (
                                            <div key={index} className="bg-slate-50 p-3 rounded-xl">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-700">{reply.author}</span>
                                                    <span className="text-xs text-slate-400">{reply.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-slate-600">{reply.content}</p>
                                            </div>
                                        ))}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Write a supportive reply..."
                                                className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                            />
                                            <button className="absolute right-1 top-1 p-1 bg-purple-600 rounded-full text-white hover:bg-purple-700 transition-colors">
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ask Wisely Dialog */}
            {showAskDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 scale-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Ask Wisely</h2>
                            <button onClick={() => setShowAskDialog(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Your Question</label>
                                <textarea
                                    value={newQuestionContent}
                                    onChange={(e) => setNewQuestionContent(e.target.value)}
                                    placeholder="e.g., I'm scared to present my project next week..."
                                    className="w-full h-32 p-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-slate-800 placeholder:text-slate-400"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-purple-900">Hide my Identity completely</p>
                                        <p className="text-xs text-purple-600">You will appear as "Anonymous"</p>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={clsx(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                                        isAnonymous ? "bg-purple-600" : "bg-slate-200"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform",
                                            isAnonymous ? "translate-x-6" : "translate-x-1"
                                        )}
                                    ></span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAskDialog(false)}
                                className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitQuestion}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                Post Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerOracle;
