'use client';

import React, { useEffect, useState } from 'react';
import { useStudent } from '@/context/student-context';
import { updateUserProfile } from '@/lib/db-service';
import { College } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrganizationSelectorProps {
    /** If true, show even if the user already has a collegeId (used from landing page) */
    forceVisible?: boolean;
    /** Callback after org is selected; if not provided, defaults to window.location.reload() */
    onComplete?: () => void;
}

export function OrganizationSelector({ forceVisible, onComplete }: OrganizationSelectorProps) {
    const { toast } = useToast();
    const { studentData, role, refreshData } = useStudent();
    const router = useRouter();
    const [colleges, setColleges] = useState<College[]>([]);
    const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const shouldShow = forceVisible || (studentData && role !== 'admin' && !studentData.collegeId);

    useEffect(() => {
        if (shouldShow) {
            setFetching(true);
            const loadColleges = async () => {
                try {
                    const db = (await import('@/lib/firebase')).getRtdb();
                    const { ref, get } = await import('firebase/database');
                    const snapshot = await get(ref(db, 'colleges'));
                    if (snapshot.exists()) {
                        const allColleges: College[] = [];
                        snapshot.forEach((child) => {
                            allColleges.push({ id: child.key!, ...child.val() });
                        });
                        setColleges(allColleges);
                    }
                } catch (e) {
                    console.error("Error loading colleges", e);
                } finally {
                    setFetching(false);
                }
            };
            loadColleges();
        }
    }, [shouldShow]);

    const handleSubmit = async () => {
        if (!selectedCollegeId || !studentData) return;
        setLoading(true);

        try {
            await updateUserProfile(studentData.uid, { collegeId: selectedCollegeId });
            toast({
                title: "Organization Joined",
                description: "You have successfully linked your account to the organization.",
            });

            if (onComplete) {
                onComplete();
            } else {
                // Default: navigate to correct dashboard by role
                if (role === 'teacher') router.push('/dashboard/teacher');
                else if (role === 'admin') router.push('/dashboard/admin');
                else router.push('/dashboard');
                // Force reload to refresh context
                setTimeout(() => window.location.reload(), 100);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Could not set your organization. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Do not show if conditions aren't met
    if (!shouldShow || !studentData) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <Card className="max-w-md w-full border-indigo-500/20 bg-[hsl(224_71%_4%)] text-white shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-indigo-500/20 p-3 rounded-full mb-2 w-fit">
                        <Building2 className="w-8 h-8 text-indigo-400" />
                    </div>
                    <CardTitle className="text-2xl font-headline tracking-tight">Select Your Organization</CardTitle>
                    <CardDescription className="text-gray-400">
                        Welcome to Arcpedia! Please select the university, college or organization you belong to.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col items-center">
                    {fetching ? (
                        <div className="flex items-center gap-2 text-indigo-400 py-4">
                            <Loader2 className="animate-spin w-5 h-5" /> Loading organizations...
                        </div>
                    ) : (
                        <div className="w-full">
                            <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                                <SelectTrigger className="w-full bg-white/5 border-indigo-500/30 h-12">
                                    <SelectValue placeholder="Select an Organization..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[hsl(224_71%_8%)] border-indigo-500/20 text-white">
                                    {colleges.length > 0 ? (
                                        colleges.map((col) => (
                                            <SelectItem key={col.id} value={col.id} className="hover:bg-indigo-500/20 cursor-pointer">
                                                {col.name} {col.location ? `(${col.location})` : ''}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-400 text-center">No organizations available. Please ask an admin to create one.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button
                        className="w-full font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity h-12"
                        disabled={!selectedCollegeId || loading || fetching}
                        onClick={handleSubmit}
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Join Workspace
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

