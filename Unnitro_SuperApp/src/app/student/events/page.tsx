"use client";

import { BackButton } from "@/components/ui/back-button";
import EventsPage from "@/components/arcpedia/dashboard/events/page";

export default function StudentEventsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <EventsPage />
    </div>
  );
}
