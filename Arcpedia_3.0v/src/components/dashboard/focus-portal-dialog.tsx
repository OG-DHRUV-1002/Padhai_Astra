
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrainCircuit } from "lucide-react";

interface FocusPortalDialogProps {
  isOpen: boolean;
  onReturn: () => void;
}

export default function FocusPortalDialog({ isOpen, onReturn }: FocusPortalDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="shadow-2xl shadow-primary/30 border-primary/50">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <AlertDialogTitle className="text-center font-headline text-2xl">
            The Oracle Senses a Distraction
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your attention seems to have drifted from the path of wisdom. Shall we return to your task?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onReturn} className="w-full">
            Return to Wisdom
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
