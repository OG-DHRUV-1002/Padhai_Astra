'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { logActivity } from '@/lib/activity-store';

import { Button } from '@/components/ui/button'; // Assuming these leverage tailwind classes we can override or wrapper
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getRecommendedResources } from './actions';
import { useResources } from '@/hooks/use-resources';
import { Loader2, ExternalLink, GraduationCap, FileText, Globe, Youtube, BookOpen, Sparkles, PlayCircle, UserSquare2 } from 'lucide-react';
import type { RecommendResourcesInput } from '@/ai/flows/recommend-relevant-learning-resources';

const resourcesFormSchema = z.object({
  courses: z.string().min(3, 'Please list at least one course.'),
  academicPerformance: z.string().min(10, 'Please provide a brief summary of your performance.'),
  learningStyle: z.string().min(5, 'Please describe your learning style.'),
});

type ResourcesFormValues = z.infer<typeof resourcesFormSchema>;

export default function ResourcesClient({
  defaultValues
}: {
  defaultValues: RecommendResourcesInput
}) {
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'teacher'>('ai');
  const { resources, loading: dbLoading } = useResources();
  const { toast } = useToast();

  const form = useForm<ResourcesFormValues>({
    resolver: zodResolver(resourcesFormSchema),
    defaultValues: {
      courses: defaultValues.courses.join(', '),
      academicPerformance: defaultValues.academicPerformance,
      learningStyle: defaultValues.learningStyle
    },
  });

  async function onSubmit(values: ResourcesFormValues) {
    setIsLoading(true);
    setRecommendations(null);

    const input = {
      ...values,
      courses: values.courses.split(',').map(c => c.trim()),
    };

    const result = await getRecommendedResources(input);
    setIsLoading(false);

    if (result.success && result.data) {
      setRecommendations(result.data.resources);
      toast({
        title: 'Resources Unlocked!',
        description: 'Your personalized Arc collection is ready.',
      });
      logActivity({
        type: "resource_search",
        title: values.courses,
        detail: `Found ${result.data.resources.length} resources for ${values.courses}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Connection Interrupted',
        description: result.error || 'Could not fetch resources. Try again.',
      });
    }
  }

  const getResourceIcon = (resource: string) => {
    const lower = resource.toLowerCase();
    if (lower.includes('youtube') || lower.includes('video') || lower.includes('playlist'))
      return <Youtube className="h-6 w-6 text-red-500" />;
    if (lower.includes('pdf') || lower.includes('drive') || lower.includes('book'))
      return <FileText className="h-6 w-6 text-orange-400" />;
    if (lower.includes('course') || lower.includes('class'))
      return <GraduationCap className="h-6 w-6 text-blue-400" />;
    return <Globe className="h-6 w-6 text-emerald-400" />;
  };

  const getResourceLabel = (resource: string) => {
    const lower = resource.toLowerCase();
    if (lower.includes('youtube')) return 'Video Tutorial';
    if (lower.includes('pdf')) return 'Document / eBook';
    if (lower.includes('course')) return 'Online Course';
    return 'Web Resource';
  };

  const cleanResourceText = (text: string) => {
    // Logic to separate URL from title if needed, or just return text
    // The prompt asks for "Title (URL)", let's try to parse that loosely for display
    const match = text.match(/^(.*)\s\((https?:\/\/.*)\)$/);
    if (match) {
      return { title: match[1], url: match[2] };
    }
    return { title: text, url: text.includes('http') ? text : `https://google.com/search?q=${encodeURIComponent(text)}` };
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in duration-500">
      {/* Input Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="mb-6 flex items-center gap-3 text-cyan-400">
            <Sparkles size={24} className="animate-pulse" />
            <h2 className="text-xl font-bold tracking-wide text-foreground">Input Parameters</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="courses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-medium ml-1">Current Courses</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                        placeholder="e.g. CS101, Linear Algebra..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="academicPerformance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-medium ml-1">Performance Context</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                        placeholder="How are you doing in these classes?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="learningStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-medium ml-1">Learning Style</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                        placeholder="e.g. Visual, Audio, Interactive..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>INITIALIZING SCAN...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 fill-white/20" />
                    <span>FIND RESOURCES</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8">
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-6 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10 border-b border-white/5 pb-4">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="text-cyan-400" />
              Learning Materials
            </h3>
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-cyan-500/20 text-cyan-400 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Sparkles className="h-4 w-4" />
                AI Engine
              </button>
              <button
                onClick={() => setActiveTab('teacher')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'teacher' ? 'bg-purple-500/20 text-purple-400 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <UserSquare2 className="h-4 w-4" />
                By Teacher
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative z-10">
            {activeTab === 'ai' && (
              <>
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pulse">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-white/50" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground mb-2">Scanning Knowledge Base...</h4>
                      <p className="text-slate-400">Querying global repositories for best matches.</p>
                    </div>
                  </div>
                )}

                {!isLoading && !recommendations && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                    <div className="h-32 w-32 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="h-16 w-16 text-slate-500" />
                    </div>
                    <h4 className="text-lg font-medium text-muted-foreground">Awaiting Input Parameters</h4>
                    <p className="text-slate-500 max-w-sm">Enter your course details on the left to activate the recommendation engine.</p>
                  </div>
                )}

                {recommendations && (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
                    {recommendations.map((recRaw, index) => {
                      const { title, url } = cleanResourceText(recRaw);
                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-cyan-500/40 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              {getResourceIcon(title)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                                  {getResourceLabel(title)}
                                </span>
                                <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                              </div>
                              <h4 className="text-base font-semibold text-foreground leading-snug truncate pr-2">
                                {title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 truncate">{url}</p>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Teacher Resources Tab */}
            {activeTab === 'teacher' && (
              <div className="h-full">
                {dbLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  </div>
                ) : resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 mt-10">
                    <div className="h-32 w-32 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <UserSquare2 className="h-16 w-16 text-slate-500" />
                    </div>
                    <h4 className="text-lg font-medium text-muted-foreground">No Resources Found</h4>
                    <p className="text-slate-500 max-w-sm">There are no materials uploaded by your professors at the moment.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
                    {resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url || "#"}
                        target={resource.url ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="group relative bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-purple-500/40 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-purple-400">
                            {resource.type === 'video' ? <PlayCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                                {resource.courseName || 'General'}
                              </span>
                              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <h4 className="text-base font-semibold text-foreground leading-snug truncate pr-2">
                              {resource.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 truncate uppercase tracking-wider">
                              {resource.type} • {new Date(resource.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
