import React from 'react';
import { ArrowRight, BrainCircuit, Shield, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#0f172a] z-[-1]">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-violet-300">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    Next-Gen Educational Ecosystem
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-400">
                    Antigravity
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Unlock your potential with an AI-driven personalized academic assistant. Manage stress, boost agility, and connect with peers in a gamified environment.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <NavLink
                        to="/dashboard"
                        className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-violet-600/25"
                    >
                        Enter Student Portal
                        <ArrowRight size={20} />
                    </NavLink>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors">
                        <BrainCircuit className="text-violet-400 mb-4" size={32} />
                        <h3 className="text-lg font-semibold text-white mb-2">AI Tutoring</h3>
                        <p className="text-slate-400 text-sm">Personalized learning paths adapted to your style.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-colors">
                        <Shield className="text-fuchsia-400 mb-4" size={32} />
                        <h3 className="text-lg font-semibold text-white mb-2">Wellbeing First</h3>
                        <p className="text-slate-400 text-sm">Monitor stress and mental health with AI insights.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                        <Zap className="text-cyan-400 mb-4" size={32} />
                        <h3 className="text-lg font-semibold text-white mb-2">Gamified Growth</h3>
                        <p className="text-slate-400 text-sm">Earn XP and badges as you master new concepts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
