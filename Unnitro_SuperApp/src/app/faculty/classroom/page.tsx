"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, FileText, Link as LinkIcon, Send, 
  MessageSquare, BrainCircuit, Library, Atom, Search, 
  Share2, Paperclip, CheckCircle2, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  type: "announcement" | "material" | "ai-insight";
  attachments?: string[];
}

const INITIAL_POSTS: Post[] = [
  {
    id: "p1", author: "Dr. Sarah Mitchell", avatar: "S", time: "2 hours ago",
    content: "Welcome to CS-401 Advanced Machine Learning! Please review the syllabus attached before our first lecture.",
    type: "announcement", attachments: ["Syllabus_2026.pdf"]
  },
  {
    id: "p2", author: "Dr. Sarah Mitchell", avatar: "S", time: "1 day ago",
    content: "I've uploaded the lecture notes for Unit 1: Neural Network Architectures.",
    type: "material", attachments: ["Unit1_Notes.pdf", "NN_Diagrams.png"]
  }
];

export default function FacultyClassroomPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostContent, setNewPostContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handlePost = (type: "announcement" | "material" | "ai-insight" = "announcement", customContent?: string) => {
    const content = customContent || newPostContent;
    if (!content.trim()) return;

    setPosts([{
      id: `p_${Date.now()}`,
      author: "Dr. Sarah Mitchell",
      avatar: "S",
      time: "Just now",
      content,
      type,
    }, ...posts]);
    setNewPostContent("");
    setAiResult(null);
  };

  const simulateSearch = (engine: string) => {
    if (!searchQuery.trim()) return;
    setAiResult(`[${engine} Results]: Found 3 relevant academic papers and 1 book chapter regarding "${searchQuery}". Key insight: ...`);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Atom className="w-32 h-32 text-indigo-400 animate-spin-slow" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">CS-401 Classroom Hub</h1>
            <p className="text-indigo-200 mt-2">Manage announcements, resources, and intelligent searches.</p>
            <div className="flex gap-3 mt-4">
              <Badge className="bg-indigo-500/20 text-indigo-300">Class Code: X9F2-K8</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300">120 Students</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stream" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="stream" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 gap-2">
              <MessageSquare className="h-4 w-4" /> Stream
            </TabsTrigger>
            <TabsTrigger value="search-engines" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 gap-2">
              <BrainCircuit className="h-4 w-4" /> AI Search Hub
            </TabsTrigger>
          </TabsList>

          {/* STREAM TAB */}
          <TabsContent value="stream" className="space-y-6">
            {/* Create Post */}
            <Card className="p-4 bg-white/[0.02] border-white/10 shadow-lg">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-300">S</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea 
                    placeholder="Announce something to your class..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-white/5 border-white/10 min-h-[100px] resize-none text-slate-200 placeholder:text-slate-500"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-300 hover:text-white">
                        <Paperclip className="h-4 w-4 mr-2" /> Attachment
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-300 hover:text-white">
                        <LinkIcon className="h-4 w-4 mr-2" /> Link
                      </Button>
                    </div>
                    <Button 
                      onClick={() => handlePost("announcement")} 
                      disabled={!newPostContent.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className="p-5 bg-white/[0.02] border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                          <AvatarFallback className="bg-indigo-500/20 text-indigo-300">{post.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-slate-200">{post.author}</h4>
                              <p className="text-xs text-slate-500">{post.time}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                          
                          {post.attachments && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.attachments.map(att => (
                                <div key={att} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-indigo-300 hover:bg-white/10 cursor-pointer transition-colors">
                                  <FileText className="h-4 w-4 text-indigo-400" /> {att}
                                </div>
                              ))}
                            </div>
                          )}

                          {post.type === "ai-insight" && (
                            <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-start gap-3">
                              <SparklesIcon className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-purple-200">Generated via AI Search Hub</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* SEARCH ENGINES TAB */}
          <TabsContent value="search-engines">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Engines Sidebar */}
              <div className="space-y-4">
                <Card className="p-4 bg-indigo-500/10 border-indigo-500/30 cursor-pointer hover:bg-indigo-500/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <Atom className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-indigo-100">Arc Reactor</h3>
                      <p className="text-xs text-indigo-300/70">Deep web & academic search</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white/[0.02] border-white/10 cursor-pointer hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <Library className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">Arc Book LM</h3>
                      <p className="text-xs text-slate-400">Search textbooks & syllabus</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-white/[0.02] border-white/10 cursor-pointer hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <BrainCircuit className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">Peer Oracle</h3>
                      <p className="text-xs text-slate-400">Crowdsourced student Q&A</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Search Interface */}
              <div className="md:col-span-2 space-y-4">
                <Card className="p-6 bg-white/[0.02] border-white/10">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-indigo-300">
                    <Search className="h-5 w-5" /> Query Arc Reactor
                  </h3>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Latest research on Transformer architectures..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-white/5 border-white/10 h-12"
                      onKeyDown={e => e.key === 'Enter' && simulateSearch("Arc Reactor")}
                    />
                    <Button onClick={() => simulateSearch("Arc Reactor")} className="h-12 bg-indigo-600 hover:bg-indigo-700 px-6">
                      Search
                    </Button>
                  </div>
                </Card>

                <AnimatePresence>
                  {aiResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Card className="p-6 bg-purple-500/10 border-purple-500/30">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-purple-200 flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4 text-purple-400" /> Result Generated
                          </h4>
                          <Button 
                            size="sm" 
                            onClick={() => handlePost("ai-insight", aiResult)}
                            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                          >
                            <Share2 className="h-4 w-4" /> Share to Stream
                          </Button>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{aiResult}</p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
