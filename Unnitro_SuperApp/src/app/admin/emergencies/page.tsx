"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, ShieldAlert, PhoneCall, MapPin, Clock, Search, ShieldCheck, BellRing, HeartPulse, User } from "lucide-react";

export default function EmergenciesPage() {
    const [search, setSearch] = useState("");
    
    // Dummy Data
    const activeEmergencies = [
        { id: "SOS-104", type: "Medical", location: "Science Block, Lab 3", time: "2 mins ago", user: "John Doe (Student)", status: "Active", priority: "High" },
        { id: "SOS-105", type: "Security", location: "Main Library, 2nd Floor", time: "5 mins ago", user: "Jane Smith (Faculty)", status: "Investigating", priority: "High" },
    ];

    const recentIncidents = [
        { id: "INC-201", type: "Fire Alarm", location: "Cafeteria", date: "Oct 12, 2026", status: "Resolved" },
        { id: "INC-200", type: "Medical", location: "Sports Complex", date: "Oct 10, 2026", status: "Resolved" },
    ];

    const fadeIn = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-red-500 flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8" /> 
                        Emergency & SOS Control
                    </h1>
                    <p className="text-muted-foreground">Monitor active SOS alerts and manage campus emergency response.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" className="gap-2">
                        <BellRing className="h-4 w-4" /> Trigger Campus Alarm
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div {...fadeIn}>
                        <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-500">
                                    <AlertCircle className="h-5 w-5" />
                                    Active SOS Alerts
                                </CardTitle>
                                <CardDescription>Real-time emergency signals triggered by campus users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {activeEmergencies.map((alert) => (
                                    <div key={alert.id} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="destructive" className="animate-pulse">{alert.status}</Badge>
                                                <span className="font-semibold text-lg">{alert.type} Emergency</span>
                                                <span className="text-xs text-muted-foreground">#{alert.id}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {alert.location}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {alert.time}</span>
                                                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {alert.user}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 text-white">Dispatch Response</Button>
                                            <Button size="sm" variant="outline" className="border-white/10">Contact User</Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-indigo-400" />
                                        Recent Incidents Log
                                    </CardTitle>
                                    <div className="relative w-48">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search incidents..." 
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 bg-white/5 border-white/10 h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {recentIncidents.map(inc => (
                                        <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                                <div>
                                                    <p className="font-medium text-sm">{inc.type}</p>
                                                    <p className="text-xs text-muted-foreground">{inc.location} • {inc.date}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{inc.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PhoneCall className="h-5 w-5 text-blue-400" />
                                    Emergency Contacts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { name: "Campus Security (Main)", number: "+1 (555) 019-8234" },
                                    { name: "Medical Center", number: "+1 (555) 019-1122" },
                                    { name: "Local Police", number: "911" },
                                ].map((contact, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div>
                                            <p className="font-medium text-sm">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{contact.number}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <PhoneCall className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full border-white/10 mt-2 text-sm">Manage Contacts</Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HeartPulse className="h-5 w-5 text-pink-400" />
                                    SOS System Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">SOS Feature Enabled</p>
                                        <p className="text-xs text-muted-foreground">Allow users to trigger SOS</p>
                                    </div>
                                    <Switch checked={true} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">Auto-dispatch Security</p>
                                        <p className="text-xs text-muted-foreground">Send security on critical alerts</p>
                                    </div>
                                    <Switch checked={true} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">Location Tracking</p>
                                        <p className="text-xs text-muted-foreground">Require GPS for SOS</p>
                                    </div>
                                    <Switch checked={true} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
