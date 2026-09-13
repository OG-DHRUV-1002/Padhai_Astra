"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// --- Types ---
interface ExamState {
    isExamActive: boolean;
    examSubject: string;
    startTime: Date | null;
    tabSwitchCount: number;
    maxTabSwitches: number;
}

interface ExamContextType extends ExamState {
    startExam: (subject: string) => void;
    endExam: (reason?: "completed" | "auto_submit" | "user_quit") => void;
    acknowledgeWarning: () => void;
    registerAutoSubmit: (fn: (() => void) | null) => void;
    showWarning: boolean;
    warningMessage: string;
}

const ExamContext = createContext<ExamContextType | null>(null);

export function useExam() {
    const ctx = useContext(ExamContext);
    if (!ctx) {
        return {
            isExamActive: false,
            examSubject: "",
            startTime: null,
            tabSwitchCount: 0,
            maxTabSwitches: 3,
            startExam: () => { },
            endExam: () => { },
            acknowledgeWarning: () => { },
            registerAutoSubmit: () => { },
            showWarning: false,
            warningMessage: "",
        } as ExamContextType;
    }
    return ctx;
}

interface Props {
    children: React.ReactNode;
}

export function ExamProvider({ children }: Props) {
    const [state, setState] = useState<ExamState>({
        isExamActive: false,
        examSubject: "",
        startTime: null,
        tabSwitchCount: 0,
        maxTabSwitches: 3,
    });

    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const autoSubmitRef = useRef<(() => void) | null>(null);

    const registerAutoSubmit = useCallback((fn: (() => void) | null) => {
        autoSubmitRef.current = fn;
    }, []);

    const startExam = useCallback((subject: string) => {
        setState({
            isExamActive: true,
            examSubject: subject,
            startTime: new Date(),
            tabSwitchCount: 0,
            maxTabSwitches: 3,
        });
    }, []);

    const endExam = useCallback((reason: "completed" | "auto_submit" | "user_quit" = "completed") => {
        setState(prev => ({
            ...prev,
            isExamActive: false,
            examSubject: "",
            startTime: null,
        }));
        setShowWarning(false);
    }, []);

    const acknowledgeWarning = useCallback(() => {
        setShowWarning(false);
    }, []);

    // --- Tab visibility detection ---
    useEffect(() => {
        if (!state.isExamActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden && state.isExamActive) {
                setState(prev => {
                    const newCount = prev.tabSwitchCount + 1;
                    const remaining = prev.maxTabSwitches - newCount;

                    if (remaining <= 0) {
                        setWarningMessage(
                            "🚫 Maximum tab switches reached! Your exam has been auto-submitted."
                        );
                        setShowWarning(true);
                        setTimeout(() => {
                            autoSubmitRef.current?.();
                        }, 2000);
                        return { ...prev, tabSwitchCount: newCount, isExamActive: false };
                    } else {
                        setWarningMessage(
                            `⚠️ Tab switch detected! (${newCount}/${prev.maxTabSwitches})\n\n${remaining} switch${remaining === 1 ? "" : "es"} remaining before auto-submission.`
                        );
                        setShowWarning(true);
                        return { ...prev, tabSwitchCount: newCount };
                    }
                });
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state.isExamActive) {
                e.preventDefault();
                e.returnValue = "An exam is in progress. Leaving will auto-submit your exam.";
                return e.returnValue;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [state.isExamActive]);

    return (
        <ExamContext.Provider
            value={{
                ...state,
                startExam,
                endExam,
                acknowledgeWarning,
                registerAutoSubmit,
                showWarning,
                warningMessage,
            }}
        >
            {children}
        </ExamContext.Provider>
    );
}
