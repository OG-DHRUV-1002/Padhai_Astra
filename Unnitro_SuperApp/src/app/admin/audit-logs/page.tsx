"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    FileText, AlertCircle, CheckCircle, Info, AlertTriangle,
    Search, Download, Clock, User, Globe, RefreshCw, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuditLogs } from "@/hooks/use-audit-logs";

type LogSeverity = "info" | "warning" | "critical";

const SEVERITY_BADGE_STYLES: Record<LogSeverity, string> = {
    info: "border-blue-500/20 text-blue-400 bg-blue-500/10",
    warning: "border-amber-500/20 text-amber-400 bg-amber-500/10",
    critical: "border-red-500/20 text-red-400 bg-red-500/10",
};

const SEVERITY_ICON: Record<LogSeverity, React.ReactNode> = {
    info: <Info className="h-4 w-4 text-blue-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    critical: <AlertCircle className="h-4 w-4 text-red-400" />,
};

export default function AdminLogsPage() {
    const { logs, loading, refresh } = useAuditLogs(50);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<LogSeverity | "all">("all");

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesType = activeFilter === "all" || log.severity === activeFilter;
            const matchesSearch = search === "" ||
                log.action.toLowerCase().includes(search.toLowerCase()) ||
                log.details.toLowerCase().includes(search.toLowerCase()) ||
                (log.userName || log.userId).toLowerCase().includes(search.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [logs, search, activeFilter]);

    const counts = useMemo(() => ({
        all: logs.length,
        info: logs.filter(l => l.severity === "info").length,
        warning: logs.filter(l => l.severity === "warning").length,
        critical: logs.filter(l => l.severity === "critical").length,
    }), [logs]);

    const filterButtons: { key: LogSeverity | "all"; label: string; color: string }[] = [
        { key: "all", label: "All", color: "bg-white/10 hover:bg-white/20" },
        { key: "info", label: "Info", color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" },
        { key: "warning", label: "Warning", color: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400" },
        { key: "critical", label: "Critical", color: "bg-red-500/10 hover:bg-red-500/20 text-red-400" },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Audit Logs</h1>
                    <p className="text-muted-foreground">View system activity, security events, and user actions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 gap-2" onClick={refresh}>
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" className="border-white/10 gap-2">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: counts.all, icon: FileText, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "Warnings", value: counts.warning, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Critical", value: counts.critical, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Info", value: counts.info, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={`${stat.bg} backdrop-blur-xl`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by action or user..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {filterButtons.map(f => (
                        <Button
                            key={f.key}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter(f.key)}
                            className={`rounded-full text-xs px-3 transition-all ${activeFilter === f.key
                                ? f.key === "all"
                                    ? "bg-white/20 text-foreground ring-1 ring-white/20"
                                    : `${f.color} ring-1 ring-current`
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {f.label} ({counts[f.key]})
                        </Button>
                    ))}
                </div>
            </div>

            {/* Log Feed */}
            <Card className="bg-black/20 border-white/5 backdrop-blur-xl flex flex-col" style={{ maxHeight: "600px" }}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-400" />
                            Event Stream
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredLogs.length} of {logs.length} events
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-[480px] px-6 pb-6">
                        <div className="space-y-3">
                            {filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Search className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="font-medium">{logs.length === 0 ? "No audit logs yet" : "No logs match your filter"}</p>
                                    <p className="text-sm">{logs.length === 0 ? "System activity will appear here as events occur." : "Try adjusting your search or filter criteria."}</p>
                                </div>
                            ) : (
                                filteredLogs.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] transition-colors group"
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {SEVERITY_ICON[log.severity] || SEVERITY_ICON.info}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <p className="text-sm font-medium leading-snug text-foreground">{log.action}: {log.details}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {log.timestamp}</span>
                                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {log.userName || log.userId}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${SEVERITY_BADGE_STYLES[log.severity] || SEVERITY_BADGE_STYLES.info}`}>
                                            {log.severity}
                                        </Badge>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
