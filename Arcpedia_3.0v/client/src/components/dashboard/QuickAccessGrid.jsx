import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrainCircuit, Play, MessagesSquare, Gamepad2, GraduationCap, Microscope } from 'lucide-react';
import clsx from 'clsx';

const ActionTile = ({ to, label, icon: Icon, color, subtext }) => (
    <NavLink
        to={to}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/5 p-5 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
        <div className={clsx("absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-30", color)}></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className={clsx("p-3 rounded-xl w-fit mb-3 bg-white/5", color.replace('bg-', 'text-'))}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {label}
                </h4>
                <p className="text-xs text-slate-400">{subtext}</p>
            </div>

            <div className="absolute right-4 bottom-4 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <Play size={16} className="text-white" />
            </div>
        </div>
    </NavLink>
);

const QuickAccessGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionTile
                to="/ai-resources"
                label="Deep Dive"
                subtext="Generate new study materials"
                icon={BrainCircuit}
                color="bg-violet-500"
            />
            <ActionTile
                to="/quiz-interface"
                label="Take Exam"
                subtext="Test your knowledge now"
                icon={GraduationCap}
                color="bg-fuchsia-500"
            />
            <ActionTile
                to="/arc-reactor"
                label="Lab Work"
                subtext="Upload & Analyze files"
                icon={Microscope}
                color="bg-cyan-500"
            />
            <ActionTile
                to="/peer-oracle"
                label="Join Chat"
                subtext="Connect with peers"
                icon={MessagesSquare}
                color="bg-emerald-500"
            />
            <ActionTile
                to="/brainstorming"
                label="De-Stress"
                subtext="Play a quick game"
                icon={Gamepad2}
                color="bg-amber-500"
            />
            <div className="rounded-2xl border border-dashed border-white/10 flex items-center justify-center p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="text-center">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors">
                        <span className="text-2xl font-light text-slate-400">+</span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">Add Widget</span>
                </div>
            </div>
        </div>
    );
};

export default QuickAccessGrid;
