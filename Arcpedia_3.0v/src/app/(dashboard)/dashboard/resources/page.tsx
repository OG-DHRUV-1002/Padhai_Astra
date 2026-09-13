"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/page-header";
import ResourcesClient from "./resources-client";
import { getCourses } from "@/lib/db-service";
import { useStudent } from "@/context/student-context";

export default function ResourcesPage() {
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
    courses: courseIds.length > 0 ? courseIds : ['CJ', 'DSA', 'SE'], // Fallback or empty
    academicPerformance: 'Average performance, strong in humanities but find technical subjects challenging.',
    learningStyle: 'Visual learner, prefer videos and interactive tutorials.'
  }

  return (
    <>
      <PageHeader
        title="Arc Resources"
        description="Get personalized learning materials based on your courses, performance, and learning style."
      />
      <ResourcesClient defaultValues={defaultValues} />
    </>
  );
}
