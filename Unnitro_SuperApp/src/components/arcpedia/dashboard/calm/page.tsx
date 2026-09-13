
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PageHeader from "@/components/arcpedia/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Wind, Music, Sparkles, Play, Pause, RefreshCw, Timer, RotateCcw, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const affirmations = [
  "You are progressing with purpose.",
  "Your hard work is building a strong foundation.",
  "Rest is a productive part of your journey.",
  "You are capable of overcoming any challenge.",
  "Each step you take is a step forward, no matter how small.",
  "Clarity and focus are within your reach.",
  "You have the wisdom to make the right choices for yourself."
];

type PomodoroPhase = 'focus' | 'break' | 'idle';

export default function TempleOfCalmPage() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [breatheText, setBreatheText] = useState('Paused');

  // Pomodoro State
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('idle');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);

  const audioRef = useRef<HTMLAudioElement | undefined>(
    typeof Audio !== 'undefined' ? new Audio('https://www.chosic.com/wp-content/uploads/2022/03/purrple-cat-dreaming-of-you.mp3') : undefined
  );

  useEffect(() => {
    setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)]);
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlayingMusic) {
        audio.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audio.pause();
      }
    }
  }, [isPlayingMusic]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathing) {
      setBreatheText('Breathe In');
      interval = setInterval(() => {
        setBreatheText(prev => (prev === 'Breathe In' ? 'Breathe Out' : 'Breathe In'));
      }, 4000);
    } else {
      setBreatheText('Paused');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathing]);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && pomodoroRunning) {
      // Phase complete
      setPomodoroRunning(false);
      if (pomodoroPhase === 'focus') {
        setPomodoroSessions(prev => prev + 1);
        setPomodoroPhase('break');
        setPomodoroTime(5 * 60); // 5 min break
      } else {
        setPomodoroPhase('focus');
        setPomodoroTime(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroRunning, pomodoroTime, pomodoroPhase]);

  const toggleBreathing = () => setIsBreathing(!isBreathing);
  const toggleMusic = () => setIsPlayingMusic(!isPlayingMusic);
  const newAffirmation = () => setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)]);

  const startPomodoro = useCallback(() => {
    if (pomodoroPhase === 'idle') {
      setPomodoroPhase('focus');
      setPomodoroTime(25 * 60);
    }
    setPomodoroRunning(true);
  }, [pomodoroPhase]);

  const resetPomodoro = useCallback(() => {
    setPomodoroRunning(false);
    setPomodoroPhase('idle');
    setPomodoroTime(25 * 60);
  }, []);

  const formatPomodoroTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const pomodoroProgress = pomodoroPhase === 'focus'
    ? ((25 * 60 - pomodoroTime) / (25 * 60)) * 100
    : pomodoroPhase === 'break'
      ? ((5 * 60 - pomodoroTime) / (5 * 60)) * 100
      : 0;

  const pomodoroCircumference = 2 * Math.PI * 54;
  const pomodoroStrokeDashoffset = pomodoroCircumference - (pomodoroProgress / 100) * pomodoroCircumference;

  return (
    <>
      <PageHeader
        title="Temple of Calm"
        description="A quiet space to rest, reflect, and rejuvenate your mind."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Breathing Exercise */}
        <Card className="lg:col-span-2 relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl shadow-2xl">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-indigo-400" />
              Guided Breathing
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-80 relative z-10">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div
                className="absolute w-full h-full bg-indigo-500/20 rounded-full transition-transform duration-[4000ms] ease-in-out"
                style={{ animation: isBreathing ? 'breathe 8s ease-in-out infinite' : 'none', transform: isBreathing ? 'scale(1)' : 'scale(0.5)' }}
              />
              <div
                className="absolute w-3/4 h-3/4 bg-violet-500/30 rounded-full transition-transform duration-[4000ms] ease-in-out"
                style={{ animation: isBreathing ? 'breathe 8s ease-in-out infinite 0.2s' : 'none', transform: isBreathing ? 'scale(1)' : 'scale(0.5)' }}
              />
              <div
                className="absolute w-1/2 h-1/2 bg-purple-500/20 rounded-full transition-transform duration-[4000ms] ease-in-out"
                style={{ animation: isBreathing ? 'breathe 8s ease-in-out infinite 0.4s' : 'none', transform: isBreathing ? 'scale(1)' : 'scale(0.5)' }}
              />
              <span className="relative text-lg font-bold text-foreground">
                {breatheText}
              </span>
            </div>
            <Button
              onClick={toggleBreathing}
              className="mt-8 w-40 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 rounded-xl"
            >
              {isBreathing ? 'Stop Session' : 'Begin Breathing'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Ambient Music */}
          <Card className="relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-violet-400" />
                Ambient Sound
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground mb-4">&quot;Dreaming of You&quot; by Purrple Cat</p>
              <Button
                onClick={toggleMusic}
                variant="outline"
                size="lg"
                className="rounded-full h-16 w-16 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all"
              >
                {isPlayingMusic ? <Pause className="h-6 w-6 text-indigo-400" /> : <Play className="h-6 w-6 text-indigo-400" />}
              </Button>
            </CardContent>
          </Card>

          {/* Affirmations */}
          <Card className="relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Daily Affirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <motion.p
                key={currentAffirmation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium text-foreground italic leading-relaxed"
              >
                &quot;{currentAffirmation}&quot;
              </motion.p>
              <Button
                onClick={newAffirmation}
                variant="ghost"
                size="sm"
                className="mt-4 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                New Affirmation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pomodoro Timer Section */}
      <div className="mt-8">
        <Card className="relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl shadow-xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-20 translate-x-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] translate-y-10 -translate-x-10 pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-emerald-400" />
              Pomodoro Focus Timer
              {pomodoroSessions > 0 && (
                <span className="ml-auto text-xs font-bold text-muted-foreground bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                  ðŸ… {pomodoroSessions} {pomodoroSessions === 1 ? 'session' : 'sessions'} completed
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
              {/* Timer Circle */}
              <div className="relative h-40 w-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="5" />
                  <motion.circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={pomodoroPhase === 'break' ? '#10b981' : '#6366f1'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={pomodoroCircumference}
                    animate={{ strokeDashoffset: pomodoroStrokeDashoffset }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-foreground font-mono tracking-tight">{formatPomodoroTime(pomodoroTime)}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                    pomodoroPhase === 'focus' ? "text-indigo-500" : pomodoroPhase === 'break' ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {pomodoroPhase === 'focus' ? 'ðŸŽ¯ Focus' : pomodoroPhase === 'break' ? 'â˜• Break' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-2">
                  {pomodoroPhase === 'focus' && "Stay focused! Minimize distractions and keep working."}
                  {pomodoroPhase === 'break' && "Take a breather. Stretch, hydrate, relax your eyes."}
                  {pomodoroPhase === 'idle' && "25 minutes of focus, followed by a 5-minute break."}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={pomodoroRunning ? () => setPomodoroRunning(false) : startPomodoro}
                    className={cn(
                      "rounded-xl px-6 shadow-lg text-white",
                      pomodoroPhase === 'break'
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25"
                    )}
                  >
                    {pomodoroRunning ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />{pomodoroPhase === 'idle' ? 'Start' : 'Resume'}</>}
                  </Button>
                  <Button
                    onClick={resetPomodoro}
                    variant="outline"
                    className="rounded-xl border-slate-200 dark:border-white/10 hover:bg-white/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Phase indicators */}
                <div className="flex items-center gap-2 mt-2">
                  {['focus', 'break'].map(phase => (
                    <div key={phase} className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      pomodoroPhase === phase
                        ? phase === 'focus'
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-white/60 dark:bg-white/5 text-muted-foreground border-slate-200 dark:border-white/10"
                    )}>
                      {phase === 'focus' ? <Timer className="h-2.5 w-2.5" /> : <Coffee className="h-2.5 w-2.5" />}
                      {phase === 'focus' ? '25 min' : '5 min'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.6); opacity: 0.7; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

