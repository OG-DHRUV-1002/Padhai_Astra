import React, { useState, useEffect, useMemo } from 'react';
import {
    BookOpen,
    Zap,
    Wrench,
    Clock,
    History
} from 'lucide-react';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';

// Mock Logic for History Aggregation
const HistoryAggregator = {
    getSummarizedHistory: (rawLogs) => {
        // Sort by timestamp descending
        const sortedLogs = [...rawLogs].sort((a, b) => b.timestamp - a.timestamp);
        const blocks = [];

        if (sortedLogs.length === 0) return blocks;

        let currentBlock = null;

        for (const log of sortedLogs) {
            // If no current block, start one
            if (!currentBlock) {
                currentBlock = createBlock(log);
                continue;
            }

            // Check if log belongs to current block (Same Context/Type and within reasonable time gap)
            const timeDiff = Math.abs(currentBlock.startTime - log.timestamp) / (1000 * 60); // minutes
            const isSameContext = currentBlock.title === log.details || currentBlock.type === log.activityType;

            if (isSameContext && timeDiff < 60) {
                // Add to block (update start time to include this earlier log)
                currentBlock.startTime = log.timestamp;
                currentBlock.durationMinutes += 5; // Assume each log adds ~5 mins or calculate actual diff
                currentBlock.eventCount++;
                currentBlock.intensityScore = Math.min(1.0, currentBlock.eventCount / 10); // Mock intensity
            } else {
                // Finalize current block and start new wone
                blocks.push(currentBlock);
                currentBlock = createBlock(log);
            }
        }
        if (currentBlock) blocks.push(currentBlock);

        return blocks;
    }
};

const createBlock = (log) => ({
    blockId: Math.random().toString(36).substr(2, 9),
    type: log.activityType,
    title: log.details,
    startTime: log.timestamp,
    durationMinutes: 10, // Base duration
    eventCount: 1,
    intensityScore: 0.1,
    contextId: log.contextId
});

const MemoryScroll = () => {
    const [groupedBlocks, setGroupedBlocks] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        // 1. Mock Raw Logs
        const now = new Date();
        const rawLogs = [];

        // Helper to clone date and sub minutes
        const subMinutes = (d, mins) => new Date(d.getTime() - mins * 60000);
        const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);

        // Today: Intense Study Session
        for (let i = 0; i < 20; i++) {
            rawLogs.push({
                timestamp: subMinutes(now, i * 2),
                activityType: "Study",
                details: "Chapter 4: Thermodynamics",
                contextId: "Physics-101"
            });
        }

        // Today: A Quiz
        rawLogs.push({
            timestamp: subMinutes(now, 120), // 2 hours ago
            activityType: "Quiz",
            details: "Thermodynamics Quiz 1",
            contextId: "Quiz-XYZ"
        });

        // Yesterday: Project Work
        const yesterday = subDays(now, 1);
        for (let i = 0; i < 50; i++) {
            rawLogs.push({
                timestamp: subMinutes(yesterday, i * 5),
                activityType: "Project",
                details: "Building reactor core UI",
                contextId: "Project-Alpha"
            });
        }

        // Last Week: Random
        const lastWeek = subDays(now, 5);
        rawLogs.push({
            timestamp: lastWeek,
            activityType: "Study",
            details: "Intro to C#",
            contextId: "CS-101"
        });

        // 2. Run Aggregation
        const blocks = HistoryAggregator.getSummarizedHistory(rawLogs);

        // 3. Group by Era
        const groups = {};
        const getEraLabel = (date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);

            const diffTime = today - compareDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Yesterday";
            if (diffDays <= 7) return "This Week";
            return "Long Ago";
        };

        blocks.forEach(block => {
            const era = getEraLabel(block.startTime);
            if (!groups[era]) groups[era] = [];
            groups[era].push(block);
        });

        // Simulate network delay
        setTimeout(() => setGroupedBlocks(groups), 800);
    }, []);

    const getColorConfig = (type) => {
        switch (type) {
            case "Study": return { color: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/30", bar: "bg-blue-500" };
            case "Quiz": return { color: "text-red-400", bg: "bg-red-500", border: "border-red-500/30", bar: "bg-red-500" };
            case "Project": return { color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30", bar: "bg-emerald-500" };
            default: return { color: "text-slate-400", bg: "bg-slate-500", border: "border-slate-500/30", bar: "bg-slate-500" };
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "Study": return BookOpen;
            case "Quiz": return Zap;
            case "Project": return Wrench;
            default: return History;
        }
    };

    const handleMemoryClick = (block) => {
        // Enforce using the standard Snackbar provider pattern if possible, or window alert if not
        // Assuming user has a snackbar provider or just console/alert for now based on snippet "Snackbar.Add"
        // I'll define a simple alert here and try to access enqueueSnackbar if available context
        if (enqueueSnackbar) {
            enqueueSnackbar(`Restoring Context: ${block.title}...`, { variant: 'info' });
        } else {
            console.log(`Restoring Context: ${block.title}...`);
            // Fallback UI indication
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 min-h-screen">
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    ⏳ Memory Scroll
                </h1>
                <p className="text-slate-400 text-lg">
                    Your journey, clustered and visualized.
                </p>
            </div>

            {/* Timeline Container */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-1/2 top-4 bottom-0 w-0.5 bg-slate-700 -ml-[1px]"></div>

                {!groupedBlocks ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupedBlocks).map(([era, blocks]) => (
                            <div key={era} className="relative">
                                {/* Era Header */}
                                <div className="flex justify-center mb-8 relative z-10">
                                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                        {era}
                                    </span>
                                </div>

                                <div className="space-y-8">
                                    {blocks.map((block, idx) => {
                                        const config = getColorConfig(block.type);
                                        const Icon = getIcon(block.type);
                                        const isEven = idx % 2 === 0;

                                        return (
                                            <div
                                                key={block.blockId}
                                                className={clsx(
                                                    "relative flex md:items-center gap-8 animate-in slide-in-from-bottom-4 duration-500",
                                                    // Alternating Layout
                                                    // On mobile (md:hidden), always align left. On desktop, alternate.
                                                    "flex-col md:flex-row",
                                                    isEven ? "md:flex-row-reverse" : ""
                                                )}
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                {/* Time Stamp (Opposite Side) */}
                                                <div className={clsx(
                                                    "hidden md:block w-1/2 text-right px-8",
                                                    isEven ? "text-left" : ""
                                                )}>
                                                    <p className="text-slate-400 font-medium">{block.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className={clsx("text-xs font-bold", config.color)}>
                                                        {block.durationMinutes} mins
                                                    </p>
                                                </div>

                                                {/* Timeline Node */}
                                                <div className="absolute left-4 md:left-1/2 -ml-3 md:-ml-4 flex items-center justify-center bg-slate-900 rounded-full border-4 border-slate-800 z-10 w-6 h-6 md:w-8 md:h-8">
                                                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${config.bg}`}></div>
                                                </div>

                                                {/* Card Content */}
                                                <div className="pl-12 md:pl-0 w-full md:w-1/2 md:px-8">
                                                    {/* Mobile Timestamp */}
                                                    <div className="md:hidden flex items-center gap-2 mb-2 text-sm">
                                                        <span className="text-slate-400">{block.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-slate-700">•</span>
                                                        <span className={clsx("font-bold", config.color)}>{block.durationMinutes} mins</span>
                                                    </div>

                                                    <div
                                                        onClick={() => handleMemoryClick(block)}
                                                        className={clsx(
                                                            "glass-card bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 hover:border-slate-500 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl",
                                                            "relative overflow-hidden"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-xl bg-slate-800/80 ${config.color}`}>
                                                                    <Icon size={24} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-slate-100 leading-tight">
                                                                        {block.title}
                                                                    </h3>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {block.eventCount} events • Intensity: {(block.intensityScore * 100).toFixed(0)}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Heatmap Visual */}
                                                        <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden mb-3">
                                                            <div
                                                                className={`h-full ${config.bar} transition-all duration-500`}
                                                                style={{ width: `${block.intensityScore * 100}%` }}
                                                            ></div>
                                                        </div>

                                                        <p className="text-xs text-slate-600 font-mono">
                                                            Cluster ID: {block.blockId}
                                                        </p>

                                                        {/* Hover Glow */}
                                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r ${config.bg} to-transparent pointer-events-none`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemoryScroll;
