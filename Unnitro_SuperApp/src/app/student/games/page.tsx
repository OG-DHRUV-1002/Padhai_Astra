"use client";

import { BackButton } from "@/components/ui/back-button";
import GamesPage from "@/components/arcpedia/dashboard/games/page";

export default function StudentGamesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <GamesPage />
    </div>
  );
}
