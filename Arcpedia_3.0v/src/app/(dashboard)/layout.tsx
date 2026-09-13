'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  Lightbulb,
  Feather,
  TrendingUp,
  User,
  Users,
  ScrollText,
  Waves,
  Brain,
  Sparkles,
  Smile,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Clock,
  Megaphone
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useStudent } from "@/context/student-context";
import { motion } from 'framer-motion';
import { AIChatWidget } from '@/components/dashboard/ai-chat-widget';
import { ThemeToggle } from '@/components/theme-toggle';
import { ExamProvider, useExam } from '@/context/exam-context';
import ExamGuardDialog, { ExamNavigationBlockDialog } from '@/components/dashboard/exam-guard-dialog';
import { OrganizationSelector } from '@/components/auth/OrganizationSelector';

const studentNavGroups = [
  {
    label: "Main",
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: "ACADEMICS",
    items: [
      { href: '/dashboard/timetable', icon: Calendar, label: 'Arc-Table' },
      { href: '/dashboard/tracking', icon: TrendingUp, label: 'Progress' },
    ]
  },
  {
    label: "LEARNING",
    items: [
      { href: '/dashboard/resources', icon: Lightbulb, label: 'Archi' },
      { href: '/dashboard/quizzes', icon: BookOpen, label: 'Arc Reactor' },
      { href: '/dashboard/arc-book-lm', icon: Sparkles, label: 'Arc Book - LM' },

    ]
  },
  {
    label: "COMMUNITY",
    items: [
      { href: '/dashboard/peer-oracle', icon: Feather, label: 'Peer Oracle' },
      { href: '/dashboard/forum', icon: Calendar, label: 'Events Pulse' },
    ]
  },
  {
    label: "WELL BEING",
    items: [
      { href: '/dashboard/memory-scroll', icon: ScrollText, label: 'Memory Scroll' },
      { href: '/dashboard/calm', icon: Waves, label: 'Temple of Calm' },
      { href: '/dashboard/laughing-arc', icon: Smile, label: 'Laughing Arc' },
    ]
  },
  {
    label: "WANNA CHECK IQ ?",
    items: [
      { href: '/dashboard/brainstorming', icon: Brain, label: 'Games Hub' },
    ]
  }
];

const teacherNavGroups = [
  {
    label: "Main",
    items: [
      { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Teacher Dashboard' },
    ]
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: '/dashboard/teacher/students', icon: Users, label: 'Students' },
      { href: '/dashboard/teacher/grading', icon: ScrollText, label: 'Gradebook' },
    ]
  },
  {
    label: "ANALYTICS",
    items: [
      { href: '/dashboard/teacher/analytics', icon: BarChart3, label: 'Class Pulse' },
    ]
  },
  {
    label: "RESOURCES",
    items: [
      { href: '/dashboard/teacher/resources', icon: Lightbulb, label: 'Resource Library' },
      { href: '/dashboard/teacher/quizzes', icon: BookOpen, label: 'Quiz Manager' },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { href: '/dashboard/timetable', icon: Clock, label: 'Timetable' },
      { href: '/dashboard/forum', icon: Megaphone, label: 'Announcements' },
    ]
  }
];

const adminNavGroups = [
  {
    label: "Main",
    items: [
      { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin Console' },
    ]
  },
  {
    label: "ORGANIZATION",
    items: [
      { href: '/dashboard/admin/users', icon: Users, label: 'User Management' },
      { href: '/dashboard/admin/colleges', icon: Building2, label: 'Colleges' },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { href: '/dashboard/admin/settings', icon: Settings, label: 'Platform Settings' },
      { href: '/dashboard/admin/logs', icon: ScrollText, label: 'Audit Logs' },
    ]
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { studentData, role, logout } = useStudent(); // Get role from context
  const userAvatar = PlaceHolderImages.find(p => p.id === "1") || PlaceHolderImages[0];

  return (
    <ExamProvider>
      <DashboardLayoutInner pathname={pathname} studentData={studentData} userAvatar={userAvatar} role={role} logout={logout}>
        {children}
      </DashboardLayoutInner>
    </ExamProvider>
  );
}

/** Inner layout that can use ExamContext hooks */
function DashboardLayoutInner({
  children,
  pathname,
  studentData,
  userAvatar,
  role,
  logout
}: {
  children: React.ReactNode;
  pathname: string;
  studentData: any;
  userAvatar: any;
  role: 'student' | 'teacher' | 'admin';
  logout: () => void;
}) {
  const router = useRouter();
  const { isExamActive, endExam } = useExam();
  const [navBlockOpen, setNavBlockOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Select navigation based on role
  let navGroups = studentNavGroups;
  if (role === 'teacher') navGroups = teacherNavGroups;
  if (role === 'admin') navGroups = adminNavGroups;

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    if (isExamActive && !href.includes('/quizzes')) {
      e.preventDefault();
      setPendingHref(href);
      setNavBlockOpen(true);
    }
  }, [isExamActive]);

  const handleStay = useCallback(() => {
    setNavBlockOpen(false);
    setPendingHref(null);
  }, []);

  const handleLeave = useCallback(() => {
    endExam("user_quit");
    setNavBlockOpen(false);
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
  }, [endExam, pendingHref, router]);

  return (
    <SidebarProvider className="bg-background/95 backdrop-blur-xl h-screen w-full overflow-hidden flex">
      {/* Global Background Elements */}
      <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 z-[-2] bg-[radial-gradient(hsl(239_84%_67%/0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(hsl(239_84%_67%/0.12)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40"></div>

        {/* Vibrant Ambient Orbs */}
        <div className="absolute top-[-15%] right-[-5%] -z-10 h-[700px] w-[700px] rounded-full bg-indigo-600/10 dark:bg-indigo-600/25 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] left-[-5%] -z-10 h-[500px] w-[500px] rounded-full bg-violet-500/8 dark:bg-violet-500/15 blur-[120px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-[30%] left-[30%] -z-10 h-[400px] w-[400px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] [animation-delay:4s] animate-pulse"></div>
      </div>

      <Sidebar className="border-r border-indigo-500/10 bg-[hsl(224_71%_4%/0.85)] backdrop-blur-2xl pt-4 shadow-2xl shadow-indigo-950/30 z-50 transition-all duration-300" collapsible="icon">
        <SidebarContent className="no-scrollbar">
          <SidebarHeader className="mb-4 px-4">
            <div className="flex items-center gap-3 pl-2 transition-all duration-300 group-data-[collapsible=icon]:pl-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden transition-all duration-300">
                <h1 className="text-xl font-headline font-bold tracking-tight text-foreground whitespace-nowrap">Arcpedia</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold whitespace-nowrap">
                  {role === 'teacher' ? 'Teacher Portal' : 'Enterprise AI'}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <div className="flex-1 px-3 space-y-6">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label} className={group.label === "Main" ? "p-0" : ""}>
                {group.label !== "Main" && (
                  <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2 font-headline group-data-[collapsible=icon]:hidden">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className={`
                            group relative overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-200
                            ${isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-muted-foreground hover:bg-indigo-500/10 hover:text-foreground'
                              }
                          `}
                          >
                            <Link href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="flex items-center gap-3 w-full">
                              <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                              <span className="font-medium truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                              {isActive && (
                                <motion.div
                                  layoutId="active-nav"
                                  className="absolute inset-0 bg-white/10 z-0"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {/* Dedicated Logout Item for Visibility */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={logout}
                      tooltip="Log Out"
                      className="group relative overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-200 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <div className="flex items-center gap-3 w-full cursor-pointer">
                        <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium truncate group-data-[collapsible=icon]:hidden">Log Out</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

          </div>

          <SidebarFooter className="p-4 mt-auto border-t border-white/5">
            {studentData && (
              <div className="flex items-center gap-2">
                <div className="glass-dark rounded-2xl p-3 flex-1 flex items-center gap-3 transition-all hover:bg-white/5 cursor-pointer group group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center overflow-hidden">
                  <Avatar className="h-9 w-9 border-2 border-white/10 transition-transform group-hover:scale-105 shrink-0">
                    <AvatarImage src={userAvatar.imageUrl} alt={studentData.name} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">{studentData.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{studentData.major || role?.toUpperCase() || 'USER'}</span>
                  </div>
                </div>
              </div>
            )}
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="relative flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 bg-background/70 backdrop-blur-xl px-6 border-b border-indigo-500/10">
          <SidebarTrigger className="-ml-2 hover:bg-white/10 rounded-lg p-2 transition-colors text-foreground" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 relative scroll-smooth thin-scrollbar">
          <div className="max-w-[1600px] mx-auto pb-20">
            <OrganizationSelector />
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }} // significantly faster
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </SidebarInset>
      <AIChatWidget />
      <ExamGuardDialog />
      <ExamNavigationBlockDialog open={navBlockOpen} onStay={handleStay} onLeave={handleLeave} />
    </SidebarProvider>
  );
}
