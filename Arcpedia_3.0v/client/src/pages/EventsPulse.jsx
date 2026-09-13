import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Heart,
    Monitor,
    Music,
    Trophy,
    Wrench,
    Users
} from 'lucide-react';
import clsx from 'clsx';

const EventsPulse = () => {
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [events, setEvents] = useState([]);

    // Category mappings for Logic and UI
    const FILTERS = [
        { value: "All", label: "All Events", icon: null },
        { value: "Neelvardhan", label: "Neelvardhan", icon: Heart },
        { value: "Tech", label: "Tech", icon: Monitor },
        { value: "Cultural", label: "Cultural", icon: Music },
        { value: "Sports", label: "Sports", icon: Trophy },
        { value: "Workshop", label: "Workshops", icon: Wrench },
    ];

    useEffect(() => {
        // Date Logic Implementation
        const now = new Date();

        // Helper to get next month
        const getNextMonth = () => {
            const d = new Date(now);
            d.setMonth(d.getMonth() + 1);
            return d;
        };

        // Helper to find specific day in month (e.g. 1st Sunday)
        const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

        const getFirstSunday = (date) => {
            let d = getFirstDayOfMonth(date);
            while (d.getDay() !== 0) { // 0 is Sunday
                d.setDate(d.getDate() + 1);
            }
            return d;
        };

        const getThirdSaturday = (date) => {
            let d = getFirstDayOfMonth(date);
            while (d.getDay() !== 6) { // 6 is Saturday
                d.setDate(d.getDate() + 1);
            }
            // Add 14 days to 1st Saturday to get 3rd
            d.setDate(d.getDate() + 14);
            return d;
        };

        const nextMonth = getNextMonth();
        const firstSundayNextMonth = getFirstSunday(nextMonth);
        const thirdSatNextMonth = getThirdSaturday(nextMonth);

        // Mock Data Initialization
        const mockEvents = [
            // Neelvardhan Special
            {
                id: 1,
                title: "Mega Food Donation Drive",
                organizer: "Neelvardhan Club",
                location: "Dahisar Station",
                category: "Social",
                date: firstSundayNextMonth,
                description: "Join us to distribute food to those in need."
            },
            {
                id: 2,
                title: "Beach Cleanup & Awareness",
                organizer: "Neelvardhan Club",
                location: "Juhu Beach",
                category: "Social",
                date: thirdSatNextMonth,
                description: "Keeping our shores clean and marine life safe."
            },
            {
                id: 3,
                title: "Old Clothes Collection Camp",
                organizer: "Neelvardhan Club",
                location: "SK Somaiya Foyer",
                category: "Social",
                date: new Date(now.getFullYear(), now.getMonth() + 2, 15),
                description: "Donate your gently used clothes for a good cause."
            },

            // Somaiya Tech & Cultural
            {
                id: 4,
                title: "Abhiyantriki 2025",
                organizer: "KJSCE",
                location: "Gargi Plaza",
                category: "Tech",
                date: new Date(2025, 9, 5), // Oct 5
                description: "Mumbai's largest tech fest featuring robotics, coding, and more."
            },
            {
                id: 5,
                title: "Symphony 2025",
                organizer: "KJ Somaiya",
                location: "Somaiya Grounds",
                category: "Cultural",
                date: new Date(2025, 1, 14), // Feb 14
                description: "The Grand Cultural Concert with star performances."
            },
            {
                id: 6,
                title: "MakerMela - Innovation Expo",
                organizer: "riidl",
                location: "SIMSR Building",
                category: "Tech",
                date: new Date(2025, 0, 11), // Jan 11
                description: "Showcase your hardware projects and innovations."
            },
            {
                id: 7,
                title: "Somaiya Hackathon (Code-X)",
                organizer: "SK Somaiya",
                location: "Aurobindo Lab",
                category: "Tech",
                date: new Date(2025, 2, 20), // Mar 20
                description: "24-hour non-stop coding marathon."
            },
            {
                id: 8,
                title: "Utkarsh - Sports Meet",
                organizer: "Somaiya Sports",
                location: "Athletic Track",
                category: "Sports",
                date: new Date(2025, 11, 10), // Dec 10
                description: "Inter-college athletics and sports championship."
            },
            {
                id: 9,
                title: "AI & Anti-Gravity Workshop",
                organizer: "CS Dept",
                location: "Seminar Hall A",
                category: "Workshop",
                date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
                description: "Hands-on GenAI session exploring modern agents."
            },
            {
                id: 10,
                title: "Fyrest - Freshers Party",
                organizer: "Student Council",
                location: "Auditorium",
                category: "Cultural",
                date: new Date(2025, 7, 25), // Aug 25
                description: "Welcome event for all First Year students."
            },
            {
                id: 11,
                title: "Mega Job Fair 2026",
                organizer: "Placement Cell",
                location: "Engineering Building",
                category: "Workshop",
                date: new Date(2026, 0, 15), // Jan 15
                description: "Connecting students with top industry recruiters."
            }
        ];

        setEvents(mockEvents);
    }, []);

    const getFilteredEvents = () => {
        let filtered = events;
        if (selectedFilter !== "All") {
            if (selectedFilter === "Neelvardhan") {
                filtered = events.filter(e => e.organizer.includes("Neelvardhan"));
            } else {
                filtered = events.filter(e => e.category === selectedFilter);
            }
        }
        return filtered.sort((a, b) => a.date - b.date);
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Social': return 'bg-pink-500 text-white';
            case 'Tech': return 'bg-blue-500 text-white';
            case 'Cultural': return 'bg-orange-500 text-white';
            case 'Sports': return 'bg-emerald-500 text-white';
            case 'Workshop': return 'bg-violet-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const handleRegister = (evt) => {
        alert(`Redirecting to Registration for ${evt.title}...`);
    };

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-4 md:px-8">
            {/* Hero Section */}
            <div className="mb-10 text-center animate-in fade-in duration-700">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2">
                    CAMPUS PULSE
                </h1>
                <p className="text-slate-400 font-medium tracking-wide">
                    Never miss a moment. Track Festivals, Drives, and Workshops.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="mb-8 flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom duration-500 delay-100">
                {FILTERS.map((filter) => {
                    const isSelected = selectedFilter === filter.value;
                    const Icon = filter.icon;
                    return (
                        <button
                            key={filter.value}
                            onClick={() => setSelectedFilter(filter.value)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-300",
                                isSelected
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            {Icon && <Icon size={16} />}
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-700 delay-200">
                {getFilteredEvents().map((evt) => (
                    <div key={evt.id} className="h-full group hover:-translate-y-2 transition-transform duration-300">
                        <div className="h-full rounded-2xl relative overflow-hidden bg-slate-800/40 border border-slate-700 backdrop-blur-md hover:border-slate-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col">

                            {/* Organizer Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className={clsx(
                                    "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider shadow-lg",
                                    getCategoryColor(evt.category)
                                )}>
                                    {evt.category}
                                </span>
                            </div>

                            {/* Neelvardhan Highlight */}
                            {evt.organizer.includes("Neelvardhan") && (
                                <div className="absolute -left-8 -top-8 w-24 h-24 bg-pink-500/30 blur-2xl rounded-full pointer-events-none group-hover:bg-pink-500/50 transition-colors"></div>
                            )}

                            <div className="pt-8 px-6 pb-4 flex-1">
                                {/* Date Badge & Title Row */}
                                <div className="flex gap-4 mb-4">
                                    <div className="flex flex-col items-center justify-center bg-slate-700/50 rounded-xl p-2 min-w-[60px] border border-slate-600 h-fit">
                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                            {evt.date.toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-xl font-black text-slate-200">
                                            {evt.date.getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-100 leading-tight mb-1 text-lg">
                                            {evt.title}
                                        </h3>
                                        <p className={clsx(
                                            "text-xs font-bold",
                                            evt.organizer.includes("Neelvardhan") ? "text-pink-400" : "text-slate-400"
                                        )}>
                                            by {evt.organizer}
                                        </p>
                                    </div>
                                </div>

                                {/* Location & Desc */}
                                <div className="mb-4 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin size={14} className="text-slate-500" />
                                        {evt.location}
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">
                                        {evt.description}
                                    </p>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-4 pt-0 mt-auto">
                                <button
                                    onClick={() => handleRegister(evt)}
                                    className={clsx(
                                        "w-full py-2 rounded-xl border font-bold transition-colors text-sm uppercase tracking-wide",
                                        evt.organizer.includes("Neelvardhan")
                                            ? "border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
                                            : "border-slate-600 text-slate-300 hover:border-slate-400 hover:bg-slate-700/30"
                                    )}
                                >
                                    Register Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {getFilteredEvents().length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <p>No events found for this category.</p>
                </div>
            )}
        </div>
    );
};

export default EventsPulse;
