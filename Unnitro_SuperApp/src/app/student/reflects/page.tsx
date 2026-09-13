"use client";

import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain } from "lucide-react";
import ArcBookPage from "@/components/arcpedia/dashboard/arc-book-lm/page";
import QuizzesPage from "@/components/arcpedia/dashboard/quizzes/page";

export default function ReflectsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <Tabs defaultValue="reactor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="reactor" className="flex items-center gap-2">
            <Brain className="w-4 h-4" /> Arc Reactor (Quizzes)
          </TabsTrigger>
          <TabsTrigger value="booklm" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Arc Book LM
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reactor">
          <QuizzesPage />
        </TabsContent>
        <TabsContent value="booklm">
          <ArcBookPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
