"use client";

import { TimetableCalendar } from "@/components/nexus/timetable-calendar";
import { BackButton } from "@/components/ui/back-button";

export default function TimetablePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <TimetableCalendar initialRole="student" />
    </div>
  );
}
