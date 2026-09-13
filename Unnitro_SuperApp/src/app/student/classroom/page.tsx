"use client";

import { useEffect, useState } from "react";
import { ClassroomView } from "@/components/nexus/classroom-view";
import ResourcesClient from "@/components/arcpedia/dashboard/resources/resources-client";
import { BackButton } from "@/components/ui/back-button";
import { getCourses } from "@/lib/db-service";
import { useStudent } from "@/context/student-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen } from "lucide-react";

export default function StudentClassroomPage() {
  const { studentData } = useStudent();
  const [courseIds, setCourseIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      if (studentData?.uid) {
        try {
          const courses = await getCourses(studentData.uid);
          setCourseIds(courses.map(c => c.id.toUpperCase()));
        } catch (e) {
          console.error("Failed to load courses for resources", e);
        }
      }
    }
    load();
  }, [studentData]);

  const defaultValues = {
    courses: courseIds.length > 0 ? courseIds : ['CJ', 'DSA', 'SE'],
    academicPerformance: 'Average performance, strong in humanities but find technical subjects challenging.',
    learningStyle: 'Visual learner, prefer videos and interactive tutorials.'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <Tabs defaultValue="campus" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="campus" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Physical Classrooms
          </TabsTrigger>
          <TabsTrigger value="arch" className="flex items-center gap-2">
            <Search className="w-4 h-4" /> Arch Search Engine
          </TabsTrigger>
        </TabsList>
        <TabsContent value="campus">
          <ClassroomView initialRole="student" />
        </TabsContent>
        <TabsContent value="arch">
          <ResourcesClient defaultValues={defaultValues} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
