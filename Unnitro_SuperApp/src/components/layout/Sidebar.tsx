"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useExam } from "@/context/exam-context";
import { ExamNavigationBlockDialog } from "@/components/arcpedia/dashboard/exam-guard-dialog";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Box,
  MapPin,
  CalendarDays,
  LineChart,
  GraduationCap,
  BrainCircuit,
  Smile,
  Users,
  Search,
  Gamepad2,
  UserCircle,
  Settings,
  BookOpen,
  UsersRound,
  FileText,
  AlertTriangle,
  Siren,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

export type Role = "STUDENT" | "FACULTY" | "ADMIN";

interface SidebarProps {
  role: Role;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const STUDENT_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { title: "3D Digital Twin", href: "/student/digital-twin", icon: Box },
      { title: "Vacant Places", href: "/student/vacant-places", icon: MapPin },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Timetable", href: "/student/timetable", icon: CalendarDays },
      { title: "Progress", href: "/student/progress", icon: LineChart },
      { title: "Classroom", href: "/student/classroom", icon: GraduationCap },
      { title: "Reflects", href: "/student/reflects", icon: BrainCircuit },
      { title: "Peace of Mind", href: "/student/peace-of-mind", icon: Smile },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Events", href: "/student/events", icon: Users },
      { title: "Lost & Found", href: "/student/lost-and-found", icon: Search },
    ],
  },
  {
    label: "Wanna Check IQ ?",
    items: [
      { title: "Games Hub", href: "/student/games", icon: Gamepad2 },
    ],
  },
  {
    label: "Profile",
    items: [
      { title: "User Profile & Settings", href: "/student/profile", icon: UserCircle },
    ],
  },
];

const FACULTY_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
      { title: "3D Digital Twin", href: "/faculty/digital-twin", icon: Box },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Timetable", href: "/faculty/timetable", icon: CalendarDays },
      { title: "Curriculum Progress", href: "/faculty/curriculum-progress", icon: BookOpen },
      { title: "Course Management", href: "/faculty/courses", icon: GraduationCap },
      { title: "Students", href: "/faculty/students", icon: UsersRound },
      { title: "Classroom", href: "/faculty/classroom", icon: Users },
      { title: "Paper Manager", href: "/faculty/paper-manager", icon: FileText },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Event Management", href: "/faculty/events", icon: Users },
      { title: "Lost & Found", href: "/faculty/lost-found", icon: Search },
    ],
  },
  {
    label: "Profile",
    items: [
      { title: "User Profile & Settings", href: "/faculty/profile", icon: UserCircle },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Emergencies", href: "/admin/emergencies", icon: Siren },
      { title: "Issues", href: "/admin/issues", icon: AlertTriangle },
      { title: "User Management", href: "/admin/users", icon: UsersRound },
    ],
  },
  {
    label: "Campus",
    items: [
      { title: "3D Digital Twin", href: "/admin/digital-twin", icon: Box },
      { title: "Campus Control", href: "/admin/control", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Platform Settings", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
    ],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { isExamActive, endExam } = useExam();
  const [navBlockOpen, setNavBlockOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    if (isExamActive && !href.includes('/quizzes') && !href.includes('/reactor')) {
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

  let navGroups: NavGroup[] = [];
  if (role === "STUDENT") navGroups = STUDENT_NAV;
  if (role === "FACULTY") navGroups = FACULTY_NAV;
  if (role === "ADMIN") navGroups = ADMIN_NAV;

  return (
    <>
    <aside
      className={cn(
        "relative z-40 h-screen flex-shrink-0 transition-all duration-300 ease-in-out",
        "glass border-r border-white/10 rounded-none bg-black/40 backdrop-blur-2xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
          {!isCollapsed && (
            <span className="font-bold text-lg text-campus-primary bg-clip-text text-transparent bg-gradient-to-r from-campus-primary to-red-500">
              Campus Nexus
            </span>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="h-8 w-8 rounded-full bg-campus-primary/20 flex items-center justify-center">
                <span className="text-campus-primary font-bold">CN</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto sidebar-scroll py-4 overflow-x-hidden">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {group.items.map((item, j) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={j}>
                      <Link
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={cn(
                          "flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 group",
                          isActive
                            ? "bg-campus-primary/15 text-campus-primary shadow-sm"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors",
                            isActive ? "text-campus-primary" : "text-gray-400 group-hover:text-white",
                            isCollapsed ? "mx-auto" : "mr-3"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="text-sm font-medium whitespace-nowrap">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer / Toggle */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl p-2 text-red-400 hover:bg-red-500/10 transition-colors group"
            title={isCollapsed ? "Log out" : undefined}
          >
            {isCollapsed ? (
              <LogOut className="h-5 w-5" />
            ) : (
              <div className="flex items-center w-full px-2 gap-3">
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Log out</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center w-full justify-between px-2">
                <span className="text-sm font-medium">Collapse</span>
                <ChevronLeft className="h-5 w-5" />
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
    <ExamNavigationBlockDialog 
      isOpen={navBlockOpen} 
      onStay={handleStay} 
      onLeave={handleLeave} 
    />
    </>
  );
}
