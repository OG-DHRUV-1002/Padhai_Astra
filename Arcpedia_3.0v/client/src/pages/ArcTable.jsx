import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Plus, Sparkles, Save, Edit2, Trash2, Calendar, BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

// Full Static Map as requested
const SUBJECT_PROFESSOR_MAP = {
    "Object Oriented Programming": "Prof. Naina Vaidya",
    "Database Management System": "Prof. Suchita Mandhare",
    "Data Structure and Algorithm using C": "Prof. Vidya Sagvekar",
    "Applied Mathematics in Engineering": "Prof. Prajakta Jadhav",
    "Discrete Structure for Data Science": "Prof. Pankaj Deshmukh",
    "Web Development": "Prof. Monali Deshpande",
    "Design and Analysis of Algorithm": "Prof. Pravin Patil",
    "Core Java": "Prof. Shriniwasan Aacharya",
    "Python Programming": "Prof. Sunita Yadav",
    "Operating System & Linux": "Prof. Ananaya Rao",
    "Embedded Systems & IOT": "Prof. Marielia Assumption",
    "Software Engineering": "Prof. Monali Deshpande",
    "Cloud Computing": "Prof. Monali Deshpande",
    "Professional Communication Skills": "Prof. Komal Kharat / Prof. Monali Deshpande",
    "Constitution of India": "Prof. Tanavi Naik",
    "Digital Electronics": "Prof. Shriniwasan Aacharya",
    "Computer Networks": "Prof. Shriniwasan Aacharya",
    "Robotics and Automation": "Prof. Marielia Assumption",
    "Algorithm & C++": "Prof. Sunita Yadav",
    "Environmental Sciences": "Prof. Ashmita Jadhav",
    ".Net Technology": "Prof. Sunita Yadav",
    "Theory Of Computation": "Prof. Ekta Gala",
    "Computer Graphics": "Prof. Shriniwasan Aacharya",
    "Advance Database Management System": "Prof. Suchita Mandhare"
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => 9 + i); // 9:00 to 17:00

const ArcTable = () => {
    // State
    const [entries, setEntries] = useState(() => {
        const saved = localStorage.getItem('arcTableEntries');
        return saved ? JSON.parse(saved) : [];
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [draggedEntry, setDraggedEntry] = useState(null);
    const [activeSlot, setActiveSlot] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState("");

    // Persist
    useEffect(() => {
        localStorage.setItem('arcTableEntries', JSON.stringify(entries));
    }, [entries]);

    // Helpers
    const getProfessor = (subject) => {
        // Direct match
        if (SUBJECT_PROFESSOR_MAP[subject]) return SUBJECT_PROFESSOR_MAP[subject];
        // Case-insensitive match
        const key = Object.keys(SUBJECT_PROFESSOR_MAP).find(k => k.toLowerCase() === subject.toLowerCase());
        return key ? SUBJECT_PROFESSOR_MAP[key] : "Unknown Professor";
    };

    // Actions
    const handleAdd = (day, hour) => {
        const slotsInDay = entries.filter(e => e.day === day);
        if (entries.find(e => e.day === day && e.hour === hour)) {
            alert("Slot already occupied! Delete or move the existing class first.");
            return;
        }

        setActiveSlot({ day, hour });
        setSelectedCourse("");
    };

    const confirmAddEntry = () => {
        if (!selectedCourse) {
            alert("Please select a course.");
            return;
        }

        const professor = getProfessor(selectedCourse);

        const newEntry = {
            id: Date.now().toString(),
            day: activeSlot.day,
            hour: activeSlot.hour,
            subject: selectedCourse,
            professor,
            type: 'manual'
        };

        setEntries([...entries, newEntry]);
        setActiveSlot(null);
        setSelectedCourse("");
    };

    const handleDelete = (id) => {
        if (window.confirm("Remove this class?")) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e, entry) => {
        setDraggedEntry(entry);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetDay, targetHour) => {
        e.preventDefault();
        if (!draggedEntry) return;

        // Check collision
        const existing = entries.find(ent => ent.day === targetDay && ent.hour === targetHour);

        if (existing) {
            // Swap logic
            const updated = entries.map(ent => {
                if (ent.id === draggedEntry.id) return { ...ent, day: targetDay, hour: targetHour };
                if (ent.id === existing.id) return { ...ent, day: draggedEntry.day, hour: draggedEntry.hour };
                return ent;
            });
            setEntries(updated);
        } else {
            // Move logic
            const updated = entries.map(ent => {
                if (ent.id === draggedEntry.id) return { ...ent, day: targetDay, hour: targetHour };
                return ent;
            });
            setEntries(updated);
        }
        setDraggedEntry(null);
    };

    // AI Generation
    const handleAIGenerate = async () => {
        const preferences = window.prompt("Describe your ideal schedule (e.g., 'Heavy classes on Mon/Wed, light on Fri'):", "Balanced workload, Free lunch breaks at 1pm");
        if (!preferences) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferences,
                    courses: Object.keys(SUBJECT_PROFESSOR_MAP) // Send available courses
                })
            });

            const data = await response.json();
            if (data.schedule) {
                // Map AI response to our entry format
                const newEntries = data.schedule.map((item, idx) => ({
                    id: `ai-${Date.now()}-${idx}`,
                    day: item.day,
                    hour: item.hour,
                    subject: item.subject,
                    professor: getProfessor(item.subject),
                    type: 'ai'
                }));
                // Merge or Replace? Let's replace for a clean slate as implied by "Generate"
                if (window.confirm("This will overwrite your current schedule. Proceed?")) {
                    setEntries(newEntries);
                }
            } else {
                alert("AI could not generate a valid schedule. Try again.");
            }
        } catch (error) {
            console.error("AI Error:", error);
            alert("Failed to connect to Neural Core. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Arc Table</h1>
                        </div>
                        <p className="text-gray-500 mt-1 ml-14">Intelligent Academic Scheduling System</p>
                    </div>

                    <div className="flex gap-3">
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">
                            <ArrowLeft size={18} />
                            Dashboard
                        </Link>
                        <button
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    AI Optimize
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px] grid grid-cols-[80px_repeat(5,1fr)]">
                            {/* Header Row */}
                            <div className="p-4 bg-gray-50 border-b border-r border-gray-200 font-semibold text-gray-400 text-center sticky left-0 z-20">
                                Time
                            </div>
                            {DAYS.map(day => (
                                <div key={day} className="p-4 bg-gray-50 border-b border-r border-gray-200 font-bold text-gray-700 text-center uppercase tracking-wider text-sm">
                                    {day}
                                </div>
                            ))}

                            {/* Body Rows */}
                            {TIME_SLOTS.map(hour => (
                                <React.Fragment key={hour}>
                                    {/* Time Label */}
                                    <div className="p-4 border-b border-r border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-500 flex items-start justify-center pt-6 sticky left-0 z-10">
                                        {hour}:00
                                    </div>

                                    {/* Day Cells */}
                                    {DAYS.map(day => {
                                        const entry = entries.find(e => e.day === day && e.hour === hour);
                                        return (
                                            <div
                                                key={`${day}-${hour}`}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day, hour)}
                                                className="relative border-b border-r border-gray-100 min-h-[120px] p-2 bg-white transition-colors hover:bg-gray-50"
                                            >
                                                {entry ? (
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, entry)}
                                                        className={clsx(
                                                            "h-full w-full rounded-xl p-3 shadow-md border-l-4 cursor-move group relative animate-in zoom-in-95 duration-200",
                                                            entry.type === 'ai' ? "bg-purple-50 border-purple-500" : "bg-blue-50 border-blue-500"
                                                        )}
                                                    >
                                                        {/* Content */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                                                                {entry.subject}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                                                                <User size={12} className="opacity-70" />
                                                                <span className="truncate">{entry.professor}</span>
                                                            </div>
                                                        </div>

                                                        {/* Hover Actions */}
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                            <button
                                                                onClick={() => handleDelete(entry.id)}
                                                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Empty State
                                                    <div
                                                        onClick={() => handleAdd(day, hour)}
                                                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm transform scale-90 hover:scale-110 transition-all">
                                                            <Plus size={18} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend / Info */}
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Manual Entry</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>AI Generated</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} />
                        <span>Drag & Drop enabled</span>
                    </div>
                </div>
            </div>

            {/* Add Class Modal */}
            {activeSlot && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Add Class for {activeSlot.day}, {activeSlot.hour}:00
                            </h3>
                            <button
                                onClick={() => setActiveSlot(null)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Course Name</label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm bg-white"
                                >
                                    <option value="" disabled>Select a course...</option>
                                    {Object.keys(SUBJECT_PROFESSOR_MAP).map(course => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Faculty Display Container */}
                            <div className={clsx(
                                "p-4 rounded-xl border transition-all duration-300 flex items-start gap-3",
                                selectedCourse
                                    ? "bg-blue-50 border-blue-100"
                                    : "bg-gray-50 border-gray-100"
                            )}>
                                <div className={clsx(
                                    "p-2 rounded-lg",
                                    selectedCourse ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400"
                                )}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-500 mb-0.5">Assigned Faculty</div>
                                    <div className={clsx(
                                        "font-semibold text-sm",
                                        selectedCourse ? "text-gray-900" : "text-gray-400 italic"
                                    )}>
                                        {selectedCourse ? getProfessor(selectedCourse) : "Waiting for course selection..."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setActiveSlot(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddEntry}
                                disabled={!selectedCourse}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Class
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArcTable;
