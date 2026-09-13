import React, { useState, useEffect } from 'react';
import { useStudent } from '../context/StudentContext';
import VitalsBar from '../components/dashboard/VitalsBar';
import SystemAlerts from '../components/dashboard/SystemAlerts';
import QuickAccessGrid from '../components/dashboard/QuickAccessGrid';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';

const Dashboard = () => {
    const { studentProfile, vitals } = useStudent();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = React.useNavigate ? React.useNavigate() : null; // Safe check if used outside Router

    useEffect(() => {
        // Simulate loading / "Initializing Neural Interface"
        const timer = setTimeout(() => {
            isLoading && setIsLoading(false);
        }, 2000); // 2 seconds pulse

        // Automatic Redirection Logic Mock
        if (!isLoading && studentProfile.sessionConfig?.initialRoute && studentProfile.sessionConfig.initialRoute !== '/dashboard') {
            // navigate(studentProfile.sessionConfig.initialRoute); // Uncomment if routing is desired
        }

        return () => clearTimeout(timer);
    }, [isLoading, studentProfile]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh] bg-black text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold animate-pulse mb-4 tracking-[0.2em] text-cyan-400">ANTI-GRAVITY</h1>
                    <p className="text-xl text-blue-400 animate-bounce">Initializing Neural Interface...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
            {/* System Alerts */}
            {studentProfile.urgentAlerts?.length > 0 && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-xl text-yellow-200">
                    <strong className="block mb-2 font-semibold tracking-wide uppercase text-xs">System Alerts:</strong>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                        {studentProfile.urgentAlerts.map((alert, index) => (
                            <li key={index}>{alert}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-sm text-slate-400">Welcome back, {studentProfile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Last Activity: <span className="text-cyan-400">{studentProfile.lastActivity?.title}</span>
                        <span className="opacity-50 mx-1">|</span>
                        {new Date(studentProfile.lastActivity?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs bg-slate-800 border border-white/10 text-white px-3 py-1.5 rounded-full font-medium">
                        {studentProfile.major}
                    </span>
                    <span className={clsx(
                        "text-xs px-3 py-1.5 rounded-full font-medium border",
                        vitals.stressLevel > 80 ? "bg-red-500/10 border-red-500/50 text-red-400" :
                            vitals.stressLevel > 50 ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" :
                                "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    )}>
                        Stress: {vitals.stressLevel}%
                    </span>
                </div>
            </div>

            {/* Arc Reactor Banner */}
            {studentProfile.sessionConfig?.showArcReactor && (
                <div className="bg-red-900/20 p-6 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
                    <div>
                        <h2 className="text-red-400 font-bold flex items-center gap-2">
                            <Sparkles size={18} />
                            Arc Reactor Active
                        </h2>
                        <p className="text-sm text-gray-300 mt-1">Adaptive challenges are enabled. Be ready.</p>
                    </div>
                    <button className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors shadow-lg shadow-red-600/20">
                        Enter Reactor
                    </button>
                </div>
            )}

            {/* Detailed Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Cognitive Agility */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-300">Cognitive Agility</h3>
                        <Sparkles className="text-violet-400" size={16} />
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">{vitals.agilityScore}</div>
                    <p className="text-xs text-slate-500 mt-1">Brainstorming Score</p>
                </div>

                {/* Weak Subjects */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-300">Weak Subjects</h3>
                    </div>
                    <div className="text-sm font-bold text-yellow-500 mt-2 line-clamp-2">
                        {studentProfile.weakSubjects?.length > 0
                            ? studentProfile.weakSubjects.join(", ")
                            : "None detected"}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Targeted for remediation</p>
                </div>

                {/* Table Preferences */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md lg:col-span-2">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-300">Table Preferences</h3>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-2 bg-black/20 p-2 rounded border border-white/5">
                        Cols: {studentProfile.tableSettings?.visibleColumns?.join(", ") || "Default"}
                    </div>
                </div>
            </div>

            {/* Keeping existing components for fullness if desired, or replacing completely. 
                User request implies replacing, but keeping VitalsBar might be nice? 
                For now following STRICT replacement logic based on user snippet to be safe.
            */}
        </div>
    );
};

export default Dashboard;
