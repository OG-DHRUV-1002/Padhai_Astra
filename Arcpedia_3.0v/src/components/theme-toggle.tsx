import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudent } from "@/context/student-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { role, toggleRole } = useStudent();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className={cn("h-9 w-9", className)} />;

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "border border-white/10 bg-white/5 backdrop-blur-md",
                "hover:bg-indigo-500/10 hover:border-indigo-500/30",
                "transition-all duration-300 group",
                className
            )}
            aria-label="Toggle theme"
        >
            <Sun
                className={cn(
                    "h-4 w-4 transition-all duration-300 absolute",
                    isDark ? "rotate-0 scale-100 text-amber-400" : "rotate-90 scale-0 text-amber-400"
                )}
            />
            <Moon
                className={cn(
                    "h-4 w-4 transition-all duration-300 absolute",
                    isDark ? "-rotate-90 scale-0 text-indigo-400" : "rotate-0 scale-100 text-indigo-400"
                )}
            />
        </button>
    );
}
