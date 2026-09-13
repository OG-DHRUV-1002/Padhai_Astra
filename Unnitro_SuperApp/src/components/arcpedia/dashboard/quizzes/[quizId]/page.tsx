"use client";

import { useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/arcpedia/dashboard/page-header";
import QuizClient from "./quiz-client";
import { useQuizzes } from "@/hooks/use-quizzes";

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const { quizzes, loading } = useQuizzes();

  const quiz = useMemo(
    () => quizzes.find(q => q.id === params.quizId),
    [quizzes, params.quizId],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <p className="text-lg font-medium">Quiz not found</p>
        <p className="text-sm">This quiz may have been removed or doesn't exist.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <PageHeader
          title={quiz.title}
          description={`A quiz for ${quiz.course}. Good luck!`}
        />
      </div>
      <QuizClient quiz={quiz} />
    </>
  );
}
