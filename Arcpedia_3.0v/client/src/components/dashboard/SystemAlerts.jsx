import React from 'react';
import { Bell, Calendar, BookOpen, AlertTriangle } from 'lucide-react';

const AlertItem = ({ icon: Icon, title, time, type }) => (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
        <div className={`p-2 rounded-lg shrink-0 ${type === 'urgent' ? 'bg-red-500/10 text-red-400' :
                type === 'event' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-violet-500/10 text-violet-400'
            }`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{time}</p>
        </div>
    </div>
);

const SystemAlerts = () => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell size={18} className="text-violet-400" />
                    System Alerts
                </h3>
                <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>

            <div className="space-y-1 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                <AlertItem
                    icon={AlertTriangle}
                    title="Exam Schedule Conflict Detected"
                    time="2 mins ago"
                    type="urgent"
                />
                <AlertItem
                    icon={BookOpen}
                    title="New Resource: Quantum Computing 101"
                    time="1 hour ago"
                    type="info"
                />
                <AlertItem
                    icon={Calendar}
                    title="Hackathon Registration Closes Today"
                    time="3 hours ago"
                    type="event"
                />
                <AlertItem
                    icon={BookOpen}
                    title="Assignment Due: Data Structures"
                    time="5 hours ago"
                    type="urgent"
                />
            </div>

            <button className="w-full mt-4 py-2 text-xs font-medium text-slate-400 hover:text-white border-t border-white/5 uppercase tracking-wider transition-colors">
                View All Notifications
            </button>
        </div>
    );
};

export default SystemAlerts;
