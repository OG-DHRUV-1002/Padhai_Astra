"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, BookOpen, Calendar, Lightbulb, Feather, ScrollText, TrendingUp, Waves, Smile, Brain } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useStudent } from "@/context/student-context";
import { OrganizationSelector } from '@/components/auth/OrganizationSelector';

const features = [
  {
    icon: <Calendar className="h-8 w-8 text-indigo-400" />,
    title: 'Arc-Table',
    description: 'AI-optimized scheduling that adapts to your academic life and ensures you never miss a clear deadline.',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-indigo-400" />,
    title: 'Progress',
    description: 'Visualize your academic journey with comprehensive grade tracking and attendance monitoring.',
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-indigo-400" />,
    title: 'Archi',
    description: 'Your 24/7 AI study companion for personalized tutoring, resource generation, and academic advice.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-indigo-400" />,
    title: 'Arc Reactor',
    description: 'Test your knowledge with interactive, AI-generated quizzes tailored to your course material.',
  },
  {
    icon: <ScrollText className="h-8 w-8 text-indigo-400" />,
    title: 'Arc Book - LM',
    description: 'Transform your notes into an interactive knowledge base using advanced language models.',
  },
  {
    icon: <Feather className="h-8 w-8 text-indigo-400" />,
    title: 'Peer Oracle',
    description: 'Connect with your campus community to share wisdom, ask questions, and grow together.',
  },
  {
    icon: <Calendar className="h-8 w-8 text-indigo-400" />,
    title: 'Events Pulse',
    description: 'Stay synchronized with campus life. Discover workshops, seminars, and social gatherings.',
  },
  {
    icon: <ScrollText className="h-8 w-8 text-indigo-400" />,
    title: 'Memory Scroll',
    description: 'A digital time capsule for your achievements, reflections, and key university milestones.',
  },
  {
    icon: <Waves className="h-8 w-8 text-indigo-400" />,
    title: 'Temple of Calm',
    description: 'A sanctuary for mental well-being with guided breathing, ambient soundscapes, and stress relief tools.',
  },
  {
    icon: <Smile className="h-8 w-8 text-indigo-400" />,
    title: 'Laughing Arc',
    description: 'Lighten the mood with AI-curated humor and jokes designed to break the stress of exam season.',
  },
  {
    icon: <Brain className="h-8 w-8 text-indigo-400" />,
    title: 'Games Hub',
    description: 'Challenge your cognitive skills with brain-teasing games and puzzles to sharpen your mind.',
  }
];

export default function Home() {
  const { studentData, role } = useStudent();
  const router = useRouter();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-landing');
  const [showOrgSelector, setShowOrgSelector] = useState(false);

  const handleGetStarted = () => {
    if (!studentData) {
      // Not logged in → go to login page
      router.push('/login');
    } else if (studentData.collegeId) {
      // Already has an org → go directly to dashboard
      if (role === 'teacher') router.push('/dashboard/teacher');
      else if (role === 'admin') router.push('/dashboard/admin');
      else router.push('/dashboard');
    } else {
      // Logged in but no org → show org selector popup
      setShowOrgSelector(true);
    }
  };

  const handleOrgComplete = () => {
    setShowOrgSelector(false);
    // Navigate to correct dashboard after org selection
    if (role === 'teacher') router.push('/dashboard/teacher');
    else if (role === 'admin') router.push('/dashboard/admin');
    else router.push('/dashboard');
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224_71%_4%)] text-white relative overflow-hidden">
      {/* Background atmospheric effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-indigo-600/20 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]"></div>
      </div>
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-2xl font-headline font-bold text-white">Arcpedia</h1>
          </div>
          {studentData ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Welcome, {studentData.name}</span>
              <Button onClick={handleGetStarted} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/login">
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-headline font-bold text-white mb-4 leading-tight">
              Your Personal <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">AI-Powered</span> Academic Assistant
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8">
              Arcpedia streamlines your student life with smart timetables, progress tracking, and personalized resources. Focus on learning, we'll handle the logistics.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 text-base px-8 py-6"
            >
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          {heroImage && (
            <div className="mt-12 relative w-full max-w-5xl mx-auto aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                width={1280}
                height={720}
                className="object-cover"
                priority
              />
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="bg-[hsl(224_50%_7%)] py-16 md:py-24 border-t border-indigo-500/10 relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-headline font-bold text-white">Everything You Need to Succeed</h3>
              <p className="text-lg text-gray-400 mt-2 max-w-2xl mx-auto">
                A suite of intelligent tools designed for the modern student.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.filter(f => f.title !== 'Journey Map').map((feature) => (
                <Card key={feature.title} className="bg-white/[0.03] border-indigo-500/10 backdrop-blur-lg text-white transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 group">
                  <CardHeader className="flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-2 group-hover:bg-indigo-500/20 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline mt-2 text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-gray-400">
                    <p>{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 relative z-10 border-t border-indigo-500/10">
        <p>&copy; {new Date().getFullYear()} Arcpedia. All rights reserved.</p>
      </footer>

      {/* Organization Selector Popup — shown when user clicks "Get Started" without an org */}
      {showOrgSelector && (
        <OrganizationSelector forceVisible={true} onComplete={handleOrgComplete} />
      )}
    </div>
  );
}
