"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Plus, Search, Building, BookOpen, Microscope, Clock, User, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";

export default function IssuesPage() {
    const [search, setSearch] = useState("");
    
    // Dummy Data
    const issues = [
        { id: "ISS-401", title: "Projector not working in Room 302", category: "Classrooms", severity: "Medium", status: "Open", user: "Dr. Smith (Faculty)", time: "2 hrs ago", comments: 2 },
        { id: "ISS-402", title: "Network down in Library 2nd Floor", category: "Libraries", severity: "High", status: "In Progress", user: "Alex Johnson (Student)", time: "5 hrs ago", comments: 4 },
        { id: "ISS-403", title: "Microscope calibration needed", category: "Labs", severity: "Low", status: "Resolved", user: "Prof. Davis", time: "1 day ago", comments: 1 },
        { id: "ISS-404", title: "AC malfunctioning in CS Lab 1", category: "Labs", severity: "Medium", status: "Open", user: "Sarah Lee (Student)", time: "30 mins ago", comments: 0 },
    ];

    const filteredIssues = issues.filter(issue => issue.title.toLowerCase().includes(search.toLowerCase()));

    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Classrooms": return <Building className="h-4 w-4" />;
            case "Libraries": return <BookOpen className="h-4 w-4" />;
            case "Labs": return <Microscope className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open": return "border-amber-500/30 text-amber-500";
            case "In Progress": return "border-blue-500/30 text-blue-500";
            case "Resolved": return "border-emerald-500/30 text-emerald-500";
            default: return "border-white/10 text-muted-foreground";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-indigo-400" /> 
                        Campus Feedback & Issues
                    </h1>
                    <p className="text-muted-foreground">Manage and track feedback from students and faculty regarding campus facilities.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-white">
                    <Plus className="h-4 w-4" /> Raise New Issue
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">All Issues</TabsTrigger>
                    <TabsTrigger value="classrooms" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2"><Building className="h-4 w-4"/> Classrooms</TabsTrigger>
                    <TabsTrigger value="labs" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2"><Microscope className="h-4 w-4"/> Labs</TabsTrigger>
                    <TabsTrigger value="libraries" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2"><BookOpen className="h-4 w-4"/> Libraries</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="m-0">
                    <motion.div {...fadeIn}>
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4">
                                <CardTitle className="text-xl">Recent Feedback</CardTitle>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by title or user..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 bg-white/5 border-white/10"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {filteredIssues.map((issue) => (
                                    <div key={issue.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors flex flex-col sm:flex-row gap-4 justify-between group">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={`gap-1 ${getStatusColor(issue.status)}`}>
                                                    {issue.status === 'Resolved' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                    {issue.status}
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1 bg-white/10">
                                                    {getCategoryIcon(issue.category)} {issue.category}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground font-mono">#{issue.id}</span>
                                            </div>
                                            <h3 className="font-semibold text-lg text-foreground group-hover:text-indigo-300 transition-colors">{issue.title}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {issue.user}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {issue.time}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between">
                                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                <MessageCircle className="h-4 w-4" /> {issue.comments}
                                            </div>
                                            <Button size="sm" variant="outline" className="border-white/10 opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredIssues.length === 0 && (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto opacity-20 mb-4" />
                                        <p>No feedback matching your search.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
                
                {/* Other Tabs would similarly filter data, omitting for brevity of dummy UI */}
                <TabsContent value="classrooms"><div className="p-8 text-center text-muted-foreground">Filtered view for Classrooms</div></TabsContent>
                <TabsContent value="labs"><div className="p-8 text-center text-muted-foreground">Filtered view for Labs</div></TabsContent>
                <TabsContent value="libraries"><div className="p-8 text-center text-muted-foreground">Filtered view for Libraries</div></TabsContent>
            </Tabs>
        </div>
    );
}
