'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from "@/components/dashboard/page-header";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Feather, Plus, Send, X, User, MessageCircle, Hash, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useForum } from "@/hooks/use-forum";
import { useAuth } from "@/context/student-context";

// Local reply interface for nested in-memory replies
interface Reply {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
  subReplies?: Reply[];
}

// Display post merges Firestore data with local reply state
interface DisplayPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Date | string;
  replies: number;
  tags?: string[];
  localReplies: Reply[];
}

export default function PeerOraclePage() {
  const { posts: firestorePosts, loading, addPost } = useForum();
  const { userData } = useAuth();

  // Map Firestore posts into local display state
  const [localPostState, setLocalPostState] = useState<Map<string, Reply[]>>(new Map());
  const [manualPosts, setManualPosts] = useState<DisplayPost[]>([]);
  const [aiPosts, setAiPosts] = useState<DisplayPost[]>([]);

  // Fetch AI-generated posts on mount for randomized content
  useEffect(() => {
    async function fetchAIPosts() {
      try {
        const res = await fetch('/api/peer-oracle/generate');
        if (!res.ok) throw new Error('AI fetch failed');
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: DisplayPost[] = data.map((p: any) => ({
            id: p.id || `ai-${Date.now()}-${Math.random()}`,
            title: p.title || "Whisper",
            content: p.content,
            author: p.author || "Anonymous Oracle",
            date: p.date || new Date().toISOString(),
            replies: (p.replies || []).length,
            tags: p.tags || ["General"],
            localReplies: (p.replies || []).map((r: any) => ({
              id: r.id || `ai-reply-${Date.now()}-${Math.random()}`,
              content: r.content,
              timestamp: new Date(r.timestamp || Date.now()),
              author: r.author || "Anonymous Peer",
              subReplies: [],
            })),
          }));
          setAiPosts(mapped);
        }
      } catch (err) {
        console.warn('AI peer oracle data unavailable:', err);
      }
    }
    fetchAIPosts();
  }, []);

  const posts: DisplayPost[] = useMemo(() => {
    const dbPosts = firestorePosts.map(p => ({
      id: p.id,
      title: p.title || "Whisper",
      content: p.content,
      author: p.isAnonymous ? "Anonymous Oracle" : (p.author || "Anonymous Oracle"),
      date: p.date,
      replies: p.replies || 0,
      tags: p.tags || ["General"],
      localReplies: localPostState.get(p.id) || [],
    }));
    return [...manualPosts, ...dbPosts, ...aiPosts];
  }, [firestorePosts, localPostState, manualPosts, aiPosts]);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyInputOpen, setReplyInputOpen] = useState<{ postId: string, parentReplyId: string | null } | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) return;
    try {
      await addPost({
        title: "New Whisper",
        content: newPostContent,
        author: "Anonymous Oracle",
        authorId: userData?.uid || "anon",
        authorAvatarId: "",
        date: new Date().toISOString(),
        replies: 0,
        course: "",
        tags: ["General"],
        isAnonymous: true,
        collegeId: userData?.collegeId,
      });
    } catch {
      // Fallback to local-only post
      const localPost: DisplayPost = {
        id: `local-${Date.now()}`,
        title: "New Whisper",
        content: newPostContent,
        author: "Anonymous Oracle",
        date: new Date(),
        replies: 0,
        tags: ["General"],
        localReplies: []
      };
      setManualPosts(prev => [localPost, ...prev]);
    }
    setNewPostContent("");
    setIsComposeOpen(false);
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim() || !replyInputOpen) return;
    const { postId, parentReplyId } = replyInputOpen;

    const newReply: Reply = {
      id: `reply-${Date.now()}`,
      content: replyContent,
      timestamp: new Date(),
      author: "Anonymous Peer",
      subReplies: []
    };

    // Update local reply state
    const addSubReply = (replies: Reply[]): Reply[] => {
      return replies.map(reply => {
        if (reply.id === parentReplyId) {
          return { ...reply, subReplies: [...(reply.subReplies || []), newReply] };
        }
        if (reply.subReplies) {
          return { ...reply, subReplies: addSubReply(reply.subReplies) };
        }
        return reply;
      });
    };

    // Check if it's a Firestore post or manual post
    const isManualPost = manualPosts.some(p => p.id === postId);

    if (isManualPost) {
      setManualPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        let updatedReplies = [...post.localReplies];
        if (parentReplyId === null) {
          updatedReplies = [...updatedReplies, newReply];
        } else {
          updatedReplies = addSubReply(updatedReplies);
        }
        return { ...post, replies: post.replies + 1, localReplies: updatedReplies };
      }));
    } else {
      setLocalPostState(prev => {
        const existing = prev.get(postId) || [];
        let updated: Reply[];
        if (parentReplyId === null) {
          updated = [...existing, newReply];
        } else {
          updated = addSubReply(existing);
        }
        return new Map(prev).set(postId, updated);
      });
    }

    setReplyContent("");
    setReplyInputOpen(null);
  };

  const countReplies = (replies?: Reply[]): number => {
    if (!replies) return 0;
    return replies.reduce((acc, reply) => acc + 1 + countReplies(reply.subReplies), 0);
  };

  // Trending Tags
  const trendingTags = useMemo(() => {
    const tagMap: Record<string, number> = {};
    posts.forEach(p => {
      (p.tags || ['General']).forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagMap).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [posts]);

  const TAG_COLORS = [
    'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    'text-violet-500 bg-violet-500/10 border-violet-500/20',
    'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    'text-amber-500 bg-amber-500/10 border-amber-500/20',
    'text-sky-500 bg-sky-500/10 border-sky-500/20',
    'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ];

  const DEPTH_BORDER_COLORS = [
    'border-indigo-300 dark:border-indigo-500/30',
    'border-violet-300 dark:border-violet-500/30',
    'border-purple-300 dark:border-purple-500/30',
    'border-pink-300 dark:border-pink-500/30',
  ];

  // Recursive Reply Component
  const ReplyItem = ({ reply, postId, depth = 0 }: { reply: Reply, postId: string, depth?: number }) => (
    <div className={cn("flex flex-col gap-2", depth > 0 && `ml-4 pl-4 border-l-2 ${DEPTH_BORDER_COLORS[Math.min(depth - 1, DEPTH_BORDER_COLORS.length - 1)]}`)}>
      <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5 relative group">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <User className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{reply.author}</span>
          <span className="text-[10px] text-slate-400">{formatDistanceToNow(reply.timestamp, { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 ml-7">{reply.content}</p>

        <button
          onClick={() => setReplyInputOpen({ postId, parentReplyId: reply.id })}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-500 font-bold hover:underline flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-full"
        >
          <MessageCircle className="h-3 w-3" /> Reply
        </button>
      </div>

      {reply.subReplies && reply.subReplies.length > 0 && (
        <div className="space-y-2 mt-1">
          {reply.subReplies.map(sub => (
            <ReplyItem key={sub.id} reply={sub} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}

      {replyInputOpen?.postId === postId && replyInputOpen?.parentReplyId === reply.id && (
        <div className="ml-8 mt-2 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
          <input
            autoFocus
            type="text"
            placeholder={`Replying to ${reply.author}...`}
            className="flex-1 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReplySubmit();
              if (e.key === 'Escape') setReplyInputOpen(null);
            }}
          />
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setReplyInputOpen(null)}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="icon" className="h-7 w-7 bg-indigo-600 hover:bg-indigo-500" onClick={handleReplySubmit}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground">Loading whispers...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <PageHeader
          title="Peer Oracle"
          description="Share anonymous encouragement and wisdom with your peers."
        />
        <Button
          onClick={() => setIsComposeOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 rounded-xl transition-all hover:scale-105"
        >
          <Plus className="mr-2 h-5 w-5" />
          Whisper to the Void
        </Button>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsComposeOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-headline font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Feather className="h-5 w-5 text-indigo-500" />
                  New Whisper
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="h-5 w-5 text-slate-500" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <Textarea
                  placeholder="Share your thought, question, or encouragement anonymously..."
                  className="min-h-[150px] bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-indigo-500 resize-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Posting as <span className="text-indigo-600 dark:text-indigo-400 font-bold">Anonymous Oracle</span></span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsComposeOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
                <Button onClick={handlePostSubmit} disabled={!newPostContent.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Post Whisper
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Trending Tags Sidebar */}
        <div className="lg:w-64 shrink-0 lg:order-2">
          <div className="sticky top-20">
            <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-foreground">Trending Tags</h3>
              </div>
              {trendingTags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags yet. Create a whisper to get started.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(([tag, count], idx) => (
                    <div key={tag} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 cursor-default",
                      TAG_COLORS[idx % TAG_COLORS.length]
                    )}>
                      <Hash className="h-3 w-3" />
                      {tag}
                      <span className="text-[9px] opacity-60">({count})</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-[10px] text-muted-foreground">💡 Tags are auto-extracted from whisper threads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="flex-1 lg:order-1">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <Feather className="h-10 w-10 text-indigo-400/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No whispers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to share an anonymous thought or encouragement.</p>
              <Button onClick={() => setIsComposeOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="mr-2 h-4 w-4" /> Write First Whisper
              </Button>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-2 gap-6 space-y-6">
              <AnimatePresence mode='popLayout'>
                {posts.map((post, index) => {
                  const actualReplyCount = countReplies(post.localReplies);

                  return (
                    <motion.div
                      layout
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={`break-inside-avoid ${expandedPostId === post.id ? "z-10" : ""}`}
                    >
                      <Card
                        className={cn(
                          "group transition-all duration-300 backdrop-blur-md cursor-pointer relative overflow-hidden border",
                          expandedPostId === post.id
                            ? 'ring-2 ring-indigo-500 shadow-2xl scale-[1.02] bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900'
                            : 'bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border-slate-200 dark:border-white/10 hover:shadow-xl hover:-translate-y-1'
                        )}
                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                      >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>

                        <CardHeader className="flex flex-row items-center gap-3 pb-3 relative z-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Feather className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{post.author}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDistanceToNow(new Date(post.date), { addSuffix: true })}</p>
                          </div>
                        </CardHeader>

                        <CardContent className="relative z-10">
                          <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed">{post.content}</p>

                          <AnimatePresence>
                            {expandedPostId === post.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Replies ({actualReplyCount})</h5>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                  {post.localReplies?.map((reply) => (
                                    <ReplyItem key={reply.id} reply={reply} postId={post.id} />
                                  ))}
                                  {(!post.localReplies || post.localReplies.length === 0) && (
                                    <p className="text-xs text-slate-400 italic">No replies yet. Be the first to whisper back.</p>
                                  )}
                                </div>

                                <div className="flex gap-2 items-center pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                                  <input
                                    type="text"
                                    placeholder="Whisper a new reply..."
                                    className="flex-1 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    value={replyInputOpen?.parentReplyId === null && replyInputOpen?.postId === post.id ? replyContent : ""}
                                    onChange={(e) => {
                                      setReplyInputOpen({ postId: post.id, parentReplyId: null });
                                      setReplyContent(e.target.value);
                                    }}
                                    onFocus={() => {
                                      setReplyInputOpen({ postId: post.id, parentReplyId: null });
                                      setReplyContent("");
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleReplySubmit();
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400"
                                    onClick={handleReplySubmit}
                                    disabled={!replyContent.trim() || replyInputOpen?.parentReplyId !== null}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>

                        <CardFooter className="text-xs text-slate-500 flex justify-between items-center px-6 pb-4 border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              {post.tags?.[0] || "General"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              <span>{actualReplyCount}</span>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
