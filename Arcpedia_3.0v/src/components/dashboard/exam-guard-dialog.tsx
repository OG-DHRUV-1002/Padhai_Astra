"use client";

import React from "react";
import { useExam } from "@/context/exam-context";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Overlay dialog that warns users when they try to switch tabs or navigate away during an exam. */
export default function ExamGuardDialog() {
    const { showWarning, warningMessage, acknowledgeWarning, tabSwitchCount, maxTabSwitches, isExamActive } = useExam();

    const isAutoSubmitted = tabSwitchCount >= maxTabSwitches;

    return (
        <AnimatePresence>
            {showWarning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative max-w-md w-full mx-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 shadow-2xl"
                    >
                        {/* Icon */}
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isAutoSubmitted
                                ? "bg-red-500/20 ring-4 ring-red-500/30"
                                : "bg-amber-500/20 ring-4 ring-amber-500/30"
                            }`}>
                            {isAutoSubmitted ? (
                                <XCircle className="h-10 w-10 text-red-500" />
                            ) : (
                                <ShieldAlert className="h-10 w-10 text-amber-500" />
                            )}
                        </div>

                        {/* Title */}
                        <h2 className={`text-2xl font-bold font-headline text-center mb-3 ${isAutoSubmitted ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                            }`}>
                            {isAutoSubmitted ? "Exam Auto-Submitted" : "Tab Switch Detected!"}
                        </h2>

                        {/* Message */}
                        <p className="text-center text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                            {warningMessage}
                        </p>

                        {/* Violation counter */}
                        {!isAutoSubmitted && (
                            <div className="flex justify-center gap-2 mb-6">
                                {Array.from({ length: maxTabSwitches }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-3 w-10 rounded-full transition-colors ${i < tabSwitchCount
                                                ? "bg-red-500 shadow-md shadow-red-500/30"
                                                : "bg-slate-200 dark:bg-white/10"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Button */}
                        <Button
                            onClick={acknowledgeWarning}
                            className={`w-full rounded-xl py-3 font-bold text-white ${isAutoSubmitted
                                    ? "bg-red-600 hover:bg-red-500"
                                    : "bg-amber-600 hover:bg-amber-500"
                                }`}
                        >
                            {isAutoSubmitted ? "View Result" : "Return to Exam"}
                        </Button>

                        {/* Footer warning */}
                        {!isAutoSubmitted && (
                            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                                <AlertTriangle className="h-3 w-3" />
                                Exam will be auto-submitted after {maxTabSwitches} switches
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Thin dialog used when a user tries to navigate away via sidebar during an active exam */
export function ExamNavigationBlockDialog({
    open,
    onStay,
    onLeave,
}: {
    open: boolean;
    onStay: () => void;
    onLeave: () => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="max-w-sm w-full mx-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 shadow-2xl text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/20 ring-4 ring-red-500/30 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2">Exam In Progress</h3>
                        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                            You have an active exam. Leaving this page will <strong className="text-red-500">auto-submit</strong> your exam and marks will not be counted.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                onClick={onStay}
                                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                            >
                                Stay in Exam
                            </Button>
                            <Button
                                onClick={onLeave}
                                variant="outline"
                                className="flex-1 rounded-xl border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold"
                            >
                                Leave & Submit
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
