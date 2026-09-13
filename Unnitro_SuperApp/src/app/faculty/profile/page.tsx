"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const mockFaculty = {
  id: "fac_1",
  name: "Dr. Sarah Mitchell",
  email: "sarah.mitchell@university.edu",
  phone: "+1 (555) 012-3456",
  department: "Computer Science Engineering",
  designation: "Associate Professor",
  office_location: "Building C, Room 402",
  office_hours: "Mon/Wed 2:00 PM - 4:00 PM",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  bio: "Dr. Mitchell specializes in Artificial Intelligence and Machine Learning. She has published over 50 papers in international journals and leads the AI research group.",
  qualifications: "Ph.D. in Computer Science (Stanford), M.Tech (MIT)",
  specialization: ["Machine Learning", "Neural Networks", "Data Science", "AI Ethics"],
  manual_status: "AVAILABLE" as "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE",
  courses: [
    { id: "cs401", code: "CS-401", name: "Advanced Machine Learning", credits: 4, semester: 7, enrolled: 120 },
    { id: "cs201", code: "CS-201", name: "Data Structures", credits: 3, semester: 3, enrolled: 85 }
  ]
};

export default function FacultyProfilePage() {
  const [currentStatus, setCurrentStatus] = useState<"AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE">(mockFaculty.manual_status);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleStatusChange = (status: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE") => {
    setCurrentStatus(status);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">Available Now</Badge>;
      case "IN CLASS":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none">In Class</Badge>;
      case "OFFICE HOURS":
        return <Badge className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border-none">Office Hours</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none">Unavailable</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-4">
            <Link href="/faculty/dashboard">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Faculty Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your information and availability</p>
            </div>
        </div>

        {/* Main Profile Header Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="p-6 md:p-8 bg-white/[0.02] border-white/10 relative overflow-hidden backdrop-blur-xl">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                <img
                    src={mockFaculty.avatar}
                    alt={mockFaculty.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white/5 shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 p-1 bg-background rounded-full">
                    <div className={`h-4 w-4 rounded-full ${
                    currentStatus === "AVAILABLE" ? "bg-emerald-500" :
                    currentStatus === "OFFICE HOURS" ? "bg-cyan-500" :
                    currentStatus === "IN CLASS" ? "bg-amber-500" : "bg-slate-500"
                    } ring-4 ring-background`} />
                </div>
                </div>

                {/* Core Info */}
                <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{mockFaculty.name}</h2>
                    {getStatusBadge(currentStatus)}
                </div>
                
                <p className="text-indigo-400 font-medium text-sm md:text-base">
                    {mockFaculty.designation} • {mockFaculty.department}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{mockFaculty.office_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{mockFaculty.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{mockFaculty.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span><strong className="text-slate-200">Office Hours:</strong> {mockFaculty.office_hours}</span>
                    </div>
                </div>
                </div>
            </div>

            {/* Live Availability Status Controls */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Live Presence Status
                </h3>
                <p className="text-xs text-slate-400 mt-1">Update your status for students and digital twin.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                {(["AVAILABLE", "IN CLASS", "OFFICE HOURS", "UNAVAILABLE"] as const).map((status) => (
                    <Button
                    key={status}
                    size="sm"
                    variant={currentStatus === status ? "default" : "ghost"}
                    onClick={() => handleStatusChange(status)}
                    className={`text-xs h-8 px-4 rounded-lg transition-all ${
                        currentStatus === status
                        ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    >
                    {status}
                    </Button>
                ))}
                </div>
            </div>

            {savedSuccess && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Status updated successfully! Synced across Unnitro platform.
                </motion.div>
            )}
            </Card>
        </motion.div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="p-6 bg-white/[0.02] border-white/10 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Academic Biography
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {mockFaculty.bio}
                </p>
                
                <div className="pt-4 mt-2 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Qualifications</h4>
                    <p className="text-sm text-slate-200 font-medium flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                    {mockFaculty.qualifications}
                    </p>
                </div>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card className="p-6 bg-white/[0.02] border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Teaching Load
                    </h3>
                    <Link href="/faculty/timetable">
                    <Button size="sm" variant="outline" className="text-xs border-white/10 hover:bg-white/5">
                        <Calendar className="w-4 h-4 mr-2" />
                        Timetable
                    </Button>
                    </Link>
                </div>

                <div className="space-y-3 pt-2">
                    {mockFaculty.courses.map((course) => (
                    <div key={course.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {course.code}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-200">{course.name}</h4>
                        </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                        <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-lg border border-white/5">
                            {course.credits} Cr • Sem {course.semester}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg">
                            {course.enrolled} Enrolled
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
                </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <Card className="p-6 bg-white/[0.02] border-white/10 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Specializations
                </h3>
                <div className="flex flex-wrap gap-2 pt-2">
                    {mockFaculty.specialization.map((spec, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        {spec}
                    </span>
                    ))}
                </div>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <Card className="p-6 bg-indigo-500/5 border-indigo-500/20 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2">Quick Actions</h3>
                        <div className="space-y-2 mt-4">
                            <Link href="/faculty/classroom" className="block">
                                <Button variant="secondary" className="w-full justify-start bg-white/5 hover:bg-white/10 text-slate-200">
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Go to Classroom
                                </Button>
                            </Link>
                            <Link href="/faculty/events" className="block">
                                <Button variant="secondary" className="w-full justify-start bg-white/5 hover:bg-white/10 text-slate-200">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Manage Events
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
