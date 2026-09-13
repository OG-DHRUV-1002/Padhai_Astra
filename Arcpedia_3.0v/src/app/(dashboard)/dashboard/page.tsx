"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useStudent } from '@/context/student-context';
import { useExam } from '@/context/exam-context';
import { getRecentActivity, getStats, ActivityEvent, ActivityStats } from '@/lib/activity-store';
import { getCourses, getUpcomingEvents, getAnnouncements } from '@/lib/db-service';
import { Course, UpcomingEvent, Announcement } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  ArrowRight, Bell, Calendar, ChevronRight, User, Sparkles,
  TrendingUp, Brain, Clock, Zap, Target, BookOpen, ScrollText,
  MessageSquare, Lightbulb, Smile, BarChart3, ShieldAlert,
  Activity, Flame, Trophy, Quote
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// --- Quick Action Data ---
const QUICK_ACTIONS = [
  { href: '/dashboard/quizzes', icon: BookOpen, label: 'Start Quiz', color: 'text-indigo-500', bg: 'bg-indigo-500/10', gradient: 'from-indigo-600 to-violet-600' },
  { href: '/dashboard/memory-scroll', icon: ScrollText, label: 'Add Memory', color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-600 to-teal-600' },
  { href: '/dashboard/forum', icon: MessageSquare, label: 'Events', color: 'text-sky-500', bg: 'bg-sky-500/10', gradient: 'from-sky-600 to-blue-600' },
  { href: '/dashboard/timetable', icon: Calendar, label: 'Timetable', color: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-600 to-orange-600' },
];

// --- Static Fallbacks ---
const FALLBACK_TIP = { tip: "Active recall > passive reading. Test yourself instead of re-reading.", emoji: "💡" };
const FALLBACK_WEEKLY = [4, 7, 3, 8, 6, 2, 5];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Activity Icon Map ---
function getActivityIcon(type: string) {
  switch (type) {
    case 'quiz_complete': return { icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    case 'memory_added': return { icon: ScrollText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'forum_post': return { icon: MessageSquare, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    case 'resource_search': return { icon: Lightbulb, color: 'text-violet-500', bg: 'bg-violet-500/10' };
    case 'joke_generated': return { icon: Smile, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    default: return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-500/10' };
  }
}

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { studentData, loading: userLoading } = useStudent();
  const { isExamActive, examSubject } = useExam();

  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // AI-generated dynamic data
  const [aiTip, setAiTip] = useState(FALLBACK_TIP);
  const [aiWeekly, setAiWeekly] = useState(FALLBACK_WEEKLY);
  const [aiStats, setAiStats] = useState<any>(null);
  const [aiLevel, setAiLevel] = useState(12);
  const [aiFocus, setAiFocus] = useState('High');
  const [aiQuote, setAiQuote] = useState<any>(null);
  const [aiStreak, setAiStreak] = useState(12);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const userAvatar = PlaceHolderImages.find((p) => p.id === "1") || PlaceHolderImages[0];

  // Load cross-module data
  useEffect(() => {
    async function load() {
      if (!studentData?.uid) return;

      try {
        const [activity, statsData, coursesData, eventsData, announcementsData] = await Promise.all([
          getRecentActivity(5).catch(() => []),
          getStats().catch(() => null),
          getCourses(studentData.uid).catch(() => []),
          getUpcomingEvents(studentData.uid, studentData.role).catch(() => []),
          getAnnouncements().catch(() => []),
        ]);
        setRecentActivity(activity);
        setStats(statsData);
        setCourses(coursesData);
        setUpcomingEvents(eventsData);
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setDataLoading(false);
      }
    }

    if (studentData) {
      load();
    }
  }, [studentData]);

  // Fetch AI-generated dynamic dashboard data
  useEffect(() => {
    async function fetchAIData() {
      try {
        const res = await fetch('/api/dashboard/generate');
        if (!res.ok) throw new Error('AI fetch failed');
        const data = await res.json();
        if (data.dailyTip) setAiTip(data.dailyTip);
        if (data.weeklyActivity) setAiWeekly(data.weeklyActivity);
        if (data.stats) setAiStats(data.stats);
        if (data.level) setAiLevel(data.level);
        if (data.focusStatus) setAiFocus(data.focusStatus);
        if (data.motivationalQuote) setAiQuote(data.motivationalQuote);
        if (data.streak) setAiStreak(data.streak);
      } catch (err) {
        console.warn('AI dashboard data unavailable, using fallback:', err);
      }
    }
    fetchAIData();
  }, []);

  const averageGrade = courses.length > 0
    ? courses.reduce((acc, course) => acc + course.grade, 0) / courses.length
    : 0;

  // --- GSAP Animations ---
  useGSAP(() => {
    if (!userLoading && !dataLoading && studentData) {
      // 1. Initial fade in for the whole container
      gsap.to(containerRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      
      // 2. Staggered reveal for layout cards
      gsap.from('.gsap-stagger-item', {
        y: 30,
        opacity: 0,
        scale: 0.98,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.2)',
        clearProps: 'all'
      });

      // 3. Staggered reveal for weekly progress bars
      gsap.fromTo('.gsap-progress-bar', 
        { height: 0 },
        { 
          height: (i, el) => el.getAttribute('data-height') || '0%', 
          duration: 0.8, 
          stagger: 0.05, 
          ease: 'power3.out',
          delay: 0.4
        }
      );
    }
  }, { dependencies: [userLoading, dataLoading, studentData], scope: containerRef });

  // GSAP Hover Micro-Interactions
  const handleCardEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1.02, y: -2, duration: 0.3, ease: 'power2.out' });
  };
  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  };

  if (userLoading || dataLoading) {
    return <div className="flex h-screen items-center justify-center text-primary animate-pulse font-headline tracking-widest uppercase text-sm">Initializing Neural Link...</div>;
  }

  if (!studentData) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-8 pb-20 opacity-0" // opacity-0 prevents FOUC before GSAP loads
    >
      {/* --- HERO SECTION --- */}
      <div className="gsap-stagger-item relative overflow-hidden rounded-[2rem] p-8 md:p-10 min-h-[260px] flex items-center bg-gradient-to-br from-indigo-100/80 dark:from-indigo-950/80 to-violet-100/80 dark:to-violet-950/60 border border-indigo-200/50 dark:border-indigo-500/20 shadow-2xl shadow-indigo-200/30 dark:shadow-indigo-950/30 group">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-violet-600/20 rounded-full blur-[100px] [animation-delay:2s] animate-pulse"></div>

        <div className="relative z-10 w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative group-hover:scale-105 transition-transform duration-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <Avatar className="h-24 w-24 border-4 border-background relative shadow-xl">
                <AvatarImage src={userAvatar.imageUrl} alt={studentData.name} className="object-cover" />
                <AvatarFallback className="text-4xl bg-black text-white"><User /></AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg text-primary/80 font-medium tracking-wide font-headline uppercase">{greeting}</h2>
              <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/50">
                {(studentData.name || 'Student').split(' ')[0]}.
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary" className="px-2.5 py-1 text-[10px] bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-indigo-200/50 dark:border-white/10 backdrop-blur-md font-bold">
                  <Sparkles className="h-3 w-3 mr-1.5 text-yellow-400" />Level {aiLevel}
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-1 text-[10px] bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-indigo-200/50 dark:border-white/10 backdrop-blur-md font-bold">
                  <Zap className="h-3 w-3 mr-1.5 text-blue-400" />Focus: {aiFocus}
                </Badge>
              </div>
            </div>
          </div>

          <Button size="lg" className="rounded-2xl px-6 h-12 text-sm font-bold bg-white text-black hover:bg-white/90 shadow-xl hover:scale-105 active:scale-95 transition-all" asChild>
            <Link href="/dashboard/timetable">
              My Schedule <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* --- EXAM IN PROGRESS ALERT --- */}
      {isExamActive && (
        <div className="gsap-stagger-item">
          <Link href="/dashboard/quizzes">
            <Card className="border-2 border-red-500/50 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 transition-all cursor-pointer group overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center animate-pulse">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-700 dark:text-red-400">Exam In Progress</h3>
                    <p className="text-sm text-red-600/70 dark:text-red-300/70">{examSubject} — Click to return</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-red-500 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* --- QUICK ACTIONS --- */}
      <div className="gsap-stagger-item">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card 
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
                className="group h-full border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg", action.bg, `group-hover:bg-gradient-to-br group-hover:${action.gradient}`)}>
                    <action.icon className={cn("h-5 w-5 transition-colors", action.color, "group-hover:text-white")} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* --- DAILY TIP + WEEKLY PROGRESS ROW --- */}
      <div className="gsap-stagger-item grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Daily Tip */}
        <Card className="lg:col-span-3 relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-gradient-to-br from-violet-100/60 dark:from-violet-950/40 to-indigo-100/60 dark:to-indigo-950/30 backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-[60px] -translate-y-10 translate-x-10" />
          <CardContent className="p-5 flex items-start gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Quote className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">💡 Daily Tip</p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                <span className="mr-1.5">{aiTip.emoji}</span>
                {aiTip.tip}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card className="lg:col-span-2 border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-indigo-500" /> Weekly Activity
            </p>
            <div className="flex items-end justify-between gap-1.5 h-16">
              {aiWeekly.map((val: number, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    data-height={`${(val / 10) * 100}%`}
                    className={cn(
                      "gsap-progress-bar w-full rounded-t-md min-h-[4px]",
                      i === new Date().getDay() - 1
                        ? "bg-gradient-to-t from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20"
                        : "bg-slate-200 dark:bg-white/10"
                    )}
                  />
                  <span className={cn(
                    "text-[9px] font-bold",
                    i === new Date().getDay() - 1 ? "text-indigo-500" : "text-muted-foreground"
                  )}>{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- ACTIVITY SUMMARY STRIP --- */}
      {(stats || aiStats) && (
        <div className="gsap-stagger-item">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Quizzes', value: aiStats?.totalQuizzes ?? stats?.totalQuizzes ?? 0, icon: BookOpen, color: 'text-indigo-500' },
              { label: 'Memories', value: aiStats?.totalMemories ?? stats?.totalMemories ?? 0, icon: ScrollText, color: 'text-emerald-500' },
              { label: 'Resources', value: aiStats?.totalResources ?? stats?.totalResources ?? 0, icon: Lightbulb, color: 'text-violet-500' },
              { label: 'Jokes', value: aiStats?.totalJokes ?? stats?.totalJokes ?? 0, icon: Smile, color: 'text-amber-500' },
              { label: 'Avg Score', value: `${aiStats?.averageQuizScore ?? stats?.averageQuizScore ?? 0}%`, icon: Trophy, color: 'text-pink-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10">
                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-black text-foreground leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COL: Stats + Courses (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* KPI Cards */}
          <div className="gsap-stagger-item grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GPA */}
            <Card className="glass-card relative overflow-hidden border-t-4 border-t-primary/50 bg-gradient-to-br from-indigo-50/50 dark:from-transparent to-transparent group">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
                  Academic Standing
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-black font-headline text-foreground">{averageGrade.toFixed(1)}</span>
                  <span className="text-xs font-bold text-muted-foreground mb-1">/ 100</span>
                </div>
                <Progress value={averageGrade} className="h-1.5 mb-3" />
                <p className="text-[10px] text-muted-foreground">Top 5% &middot; Consistent</p>
              </CardContent>
            </Card>

            {/* Streak */}
            <Card className="glass-card relative overflow-hidden border-t-4 border-t-purple-500/50 bg-gradient-to-br from-violet-50/50 dark:from-transparent to-transparent group">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
                  Daily Streak
                  <Flame className="h-3.5 w-3.5 text-purple-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-black font-headline text-foreground">{aiStreak}</span>
                  <span className="text-xs font-bold text-muted-foreground mb-1">Days</span>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-1.5 w-full rounded-full ${i < 5 ? "bg-purple-500" : "bg-slate-200 dark:bg-white/10"}`}></div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">You're on fire! 🔥</p>
              </CardContent>
            </Card>

            {/* Next Event */}
            <Card className="glass-card relative overflow-hidden border-t-4 border-t-emerald-500/50 bg-gradient-to-br from-emerald-50/50 dark:from-transparent to-transparent group">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
                  Up Next
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents[0] ? (
                  <>
                    <h3 className="text-base font-bold line-clamp-1 mb-1 text-foreground">{upcomingEvents[0].title}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 flex items-center gap-1">
                      {format(upcomingEvents[0].date, 'h:mm a')} &middot; {upcomingEvents[0].location || "Room 303"}
                    </p>
                    <Button variant="outline" size="sm" className="w-full border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] uppercase font-bold tracking-wider rounded-xl">
                      Check In
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Courses */}
          <div className="gsap-stagger-item space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline tracking-tight text-foreground">Active Courses</h3>
              <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">View All</Button>
            </div>

            <div className="grid gap-3">
              {courses.slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.01, x: 3, duration: 0.3, ease: 'power2.out' })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, x: 0, duration: 0.3, ease: 'power2.out' })}
                  className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.06] transition-all p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${course.grade > 85 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-primary/20 text-primary'}`}>
                      {course.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none mb-0.5 group-hover:text-primary transition-colors text-foreground">{course.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{course.instructor} &middot; {course.credits} Credits</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col items-end gap-1 w-full md:w-28">
                      <div className="flex justify-between w-full text-[10px] font-bold text-muted-foreground">
                        <span>Progress</span>
                        <span className="text-foreground">{course.grade}%</span>
                      </div>
                      <Progress value={course.grade} className="h-1" />
                    </div>
                    <Button size="icon" variant="ghost" className="hidden md:flex rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COL: Activity Feed + Updates */}
        <div className="gsap-stagger-item space-y-6">

          {/* Recent Activity Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline tracking-tight text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Activity
              </h3>
            </div>

            <Card className="glass-dark border-0">
              <CardContent className="p-0">
                {(recentActivity || []).length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-indigo-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 font-semibold">No activity yet</p>
                    <p className="text-[10px] text-muted-foreground">Start a quiz or add a memory to see your feed.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {(recentActivity || []).map((event, i) => {
                      const cfg = getActivityIcon(event.type);
                      return (
                        <div key={event.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex gap-3">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                              <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-foreground line-clamp-1">{event.title}</h5>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{event.detail}</p>
                              <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                                {event.timestamp ? format(new Date(event.timestamp), 'MMM d, h:mm a') : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Updates & Alerts */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold font-headline tracking-tight text-foreground">Updates</h3>
            <Card className="glass-dark border-0">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {studentData.urgentAlerts && studentData.urgentAlerts.length > 0 && studentData.urgentAlerts.map((alert: any) => (
                    <div key={alert.id} className="p-4 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors border-l-2 border-red-500">
                      <div className="flex gap-3">
                        <Bell className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-red-700 dark:text-red-300 mb-0.5">{alert.title}</h5>
                          <p className="text-[10px] text-red-600/70 dark:text-red-200/70 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {announcements.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{format(ann.date, 'MMM d')}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <h5 className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors line-clamp-1 text-foreground">{ann.title}</h5>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2">
                  <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100">View Archive</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
