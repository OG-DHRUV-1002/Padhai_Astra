'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedTimetable } from './actions';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WeeklyPlanner } from '@/components/dashboard/timetable/weekly-planner';

const timetableFormSchema = z.object({
  courseSchedule: z.string().min(10, 'Please provide your course schedule.'),
  personalCommitments: z.string().min(10, 'Please list personal commitments or "None".'),
  studyPreferences: z.string().min(10, 'Please describe your study preferences.'),
});

type TimetableFormValues = z.infer<typeof timetableFormSchema>;

export default function TimetableClient() {
  const [generatedTimetable, setGeneratedTimetable] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      courseSchedule: `CJ/DSA(Pract) A314 MON/TUE 7-9am
SE(Pract) A314 THURS 7-9am
OS(Pract) A314 FRI 7-9am
Minor MON/TUE/WED/THURS 10-11am
SE FRI 10-11am
DSA MON 11am-12pm
CJ TUE 11am-12pm
PCS WED/Thurs 11am-12pm
OS FRI 11am-12pm
OS MON/TUE 12-1pm
PDS WED/THURS 12-1pm
CJ FRI 12-1pm
SE MON 1-2pm
DSA TUE 1-2pm
CJ WED 1-2pm
DSA THURS 1-2pm`,
      personalCommitments: 'None',
      studyPreferences: 'Prefer to study in the evenings. Like to review lecture notes on the same day.',
    },
  });

  async function onSubmit(values: TimetableFormValues) {
    setIsLoading(true);
    setGeneratedTimetable(null);
    const result = await getOptimizedTimetable(values);
    setIsLoading(false);

    if (result.success && result.data) {
      setGeneratedTimetable(result.data.optimizedTimetable);
      toast({
        title: 'Timetable Generated!',
        description: 'Your new optimized timetable is ready.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
      });
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">
      {/* AI Generator Sidebar */}
      <div className="lg:w-80 flex-shrink-0 space-y-4">
        <Card className="glass dark:glass-dark h-full overflow-y-auto custom-scrollbar">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={isLoading ? "animate-spin text-primary" : "text-primary"} />
              AI Generator
            </CardTitle>
            <CardDescription>
              Describe your ideal schedule and let AI optimize it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="courseSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Courses</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="CS101: Mon 10am..."
                          rows={6}
                          {...field}
                          className="bg-background/50 text-sm resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personalCommitments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Commitments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Gym: Tue 6am..."
                          rows={3}
                          {...field}
                          className="bg-background/50 text-sm resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studyPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Preferences</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mornings..."
                          rows={3}
                          {...field}
                          className="bg-background/50 text-sm resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                  {isLoading ? 'Optimizing...' : 'Generate New Plan'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Planner */}
      <div className="flex-1 min-w-0">
        <WeeklyPlanner />
      </div>
    </div>
  );
}
