import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3X3, Calculator, Gamepad2, Crown, Puzzle, Trophy, Flame, Target } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

const games = [
    {
        title: "Sudoku",
        description: "Classic logic-based number-placement puzzle. Sharpen your analytical thinking.",
        icon: Grid3X3,
        href: "/dashboard/brainstorming/sudoku",
        gradient: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-400",
        borderHover: "hover:border-blue-500/40",
        shadow: "hover:shadow-blue-500/10",
        available: true,
    },
    {
        title: "2048",
        description: "Join the numbers and get to the 2048 tile! Train your strategic thinking.",
        icon: Calculator,
        href: "/dashboard/brainstorming/2048",
        gradient: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-400",
        borderHover: "hover:border-amber-500/40",
        shadow: "hover:shadow-amber-500/10",
        available: true,
    },
    {
        title: "Chess",
        description: "The ultimate game of strategy. Challenge the AI or play against friends.",
        icon: Crown,
        href: "#",
        gradient: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-400",
        borderHover: "",
        shadow: "",
        available: false,
    },
    {
        title: "Wordle",
        description: "Guess the hidden word in 6 tries. Test your vocabulary and deduction.",
        icon: Puzzle,
        href: "#",
        gradient: "from-violet-500/20 to-purple-500/20",
        iconColor: "text-violet-400",
        borderHover: "",
        shadow: "",
        available: false,
    }
];

// Mock stats
const GAME_STATS = [
    { label: "Games Played", value: "47", icon: Gamepad2, color: "text-indigo-500" },
    { label: "Best Streak", value: "12", icon: Flame, color: "text-orange-500" },
    { label: "Avg Score", value: "89%", icon: Target, color: "text-emerald-500" },
    { label: "Achievements", value: "8", icon: Trophy, color: "text-amber-500" },
];

export default function BrainstormingPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Brainstorming"
                description="Keep your mind sharp with these logic puzzles and brain-teasing challenges."
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GAME_STATS.map(stat => (
                    <div key={stat.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10">
                        <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <p className="text-lg font-black text-foreground leading-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {games.map((game) => (
                    <Link key={game.title} href={game.href} className={`block group ${!game.available ? 'pointer-events-none' : ''}`}>
                        <Card className={`h-full overflow-hidden relative border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl transition-all duration-300 ${game.available ? `group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:shadow-2xl ${game.borderHover} ${game.shadow}` : 'opacity-70'}`}>
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 ${game.available ? 'group-hover:opacity-100' : ''} transition-opacity duration-500 pointer-events-none`}></div>

                            {/* Coming Soon overlay */}
                            {!game.available && (
                                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 text-xs font-bold px-3 py-1 shadow-lg shadow-violet-500/20">
                                        Coming Soon
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="relative z-10">
                                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${game.gradient} border border-white/10 flex items-center justify-center mb-4 transition-transform duration-300 ${game.available ? 'group-hover:scale-110' : ''} shadow-lg`}>
                                    <game.icon className={`h-7 w-7 ${game.iconColor}`} />
                                </div>
                                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                                    {game.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-1">
                                    {game.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="relative z-10">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Gamepad2 className="h-3.5 w-3.5" />
                                    <span>{game.available ? 'Play Now' : 'Coming Soon'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
