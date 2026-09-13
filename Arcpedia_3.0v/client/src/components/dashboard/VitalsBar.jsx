import React from 'react';
import { Activity, Brain, Battery, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useStudent } from '../../context/StudentContext';

const VitalCard = ({ label, value, max = 100, icon: Icon, color, unit = "%" }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/10 transition-colors group">
            <div className="flex items-center justify-between mb-2">
                <div className={clsx("p-2 rounded-lg bg-white/5", color)}>
                    <Icon size={20} />
                </div>
                <span className="text-2xl font-bold text-white group-hover:scale-110 transition-transform origin-right">
                    {value}<span className="text-sm text-slate-500 font-normal ml-0.5">{unit}</span>
                </span>
            </div>
            <div>
                <p className="text-sm text-slate-400 mb-2">{label}</p>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={clsx("h-full rounded-full transition-all duration-1000 ease-out", color.replace('text-', 'bg-'))}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const VitalsBar = () => {
    const { vitals } = useStudent();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <VitalCard
                label="Stress Level"
                value={vitals.stressLevel}
                icon={Activity}
                color="text-red-400"
            // Invert visual meaning for stress: High stress is "full" bar but maybe red
            />
            <VitalCard
                label="Mental Agility"
                value={vitals.agilityScore}
                icon={Brain}
                color="text-violet-400"
            />
            <VitalCard
                label="Energy Bank"
                value={vitals.sleepQuality}
                icon={Battery}
                color="text-emerald-400"
            />
            <VitalCard
                label="Focus Index"
                value={vitals.focusIndex}
                icon={Zap}
                color="text-amber-400"
            />
        </div>
    );
};

export default VitalsBar;
