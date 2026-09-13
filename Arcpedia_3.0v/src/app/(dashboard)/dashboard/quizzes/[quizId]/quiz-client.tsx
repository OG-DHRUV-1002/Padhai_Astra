
"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, RotateCw, BrainCircuit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDistractionDetector } from "@/hooks/use-distraction-detector";
import FocusPortalDialog from "@/components/dashboard/focus-portal-dialog";

export default function QuizClient({ quiz }: { quiz: Quiz }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const { isDistracted, resetDistraction } = useDistractionDetector(isFocusMode);


  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
  };
  
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  const score = quiz.questions.reduce((acc, question) => {
    return selectedAnswers[question.id] === question.correctAnswer ? acc + 1 : acc;
  }, 0);

  if (isFinished) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Quiz Complete!</CardTitle>
          <CardDescription>You scored</CardDescription>
          <p className="text-5xl font-bold text-primary">{score} / {quiz.questions.length}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quiz.questions.map(q => (
              <div key={q.id} className="p-3 rounded-lg border">
                <p className="font-semibold mb-2">{q.text}</p>
                <div className="flex items-center gap-2 text-sm">
                  {selectedAnswers[q.id] === q.correctAnswer ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>Your answer: {selectedAnswers[q.id] || "No answer"}</span>
                </div>
                {selectedAnswers[q.id] !== q.correctAnswer && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                     <CheckCircle className="h-5 w-5" />
                    <span>Correct answer: {q.correctAnswer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" asChild className="w-full sm:w-auto">
             <Link href="/dashboard/quizzes"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Quizzes</Link>
           </Button>
           <Button onClick={restartQuiz} className="w-full sm:w-auto">
             <RotateCw className="mr-2 h-4 w-4"/> Retake Quiz
           </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
    <FocusPortalDialog isOpen={isDistracted} onReturn={resetDistraction} />
    <Card className="max-w-2xl mx-auto">
       <CardHeader>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <Label htmlFor="focus-mode-switch" className="font-medium">Focus Portal</Label>
            </div>
            <Switch
                id="focus-mode-switch"
                checked={isFocusMode}
                onCheckedChange={setIsFocusMode}
            />
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-xl font-headline">Question {currentQuestionIndex + 1}/{quiz.questions.length}</CardTitle>
        <CardDescription className="text-lg pt-2">{currentQuestion.text}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAnswers[currentQuestion.id]}
          onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <Label key={option} className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-muted has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
              <RadioGroupItem value={option} id={option} className="mr-3" />
              <span>{option}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestion.id]} className="w-full">
          {currentQuestionIndex < quiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
    </>
  );
}
