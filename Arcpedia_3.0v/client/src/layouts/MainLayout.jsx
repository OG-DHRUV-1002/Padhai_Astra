import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Home as HomeIcon,
    Calendar,
    TrendingUp,
    Lightbulb,
    Atom,
    PenTool,
    CalendarDays,
    History,
    Smile,
    BrainCircuit,
    Menu,
    X,
    Search,
    Bell,
    Sun,
    Grid3x3,
    Gamepad2,
    Wind,
    BookOpen
} from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label, onClick, state }) => {
    return (
        <NavLink
            to={to}
            state={state}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive
                    ? "bg-gradient-to-r from-violet-600/50 to-indigo-600/50 text-white shadow-lg border border-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
};

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const { studentProfile, vitals } = useStudent();
    const location = useLocation();

    // Close sidebar on mobile route change
    React.useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location]);

    return (
        <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')] bg-cover bg-center bg-fixed">
            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-0"></div>

            {/* Sidebar */}
            <aside
                className={clsx(
                    "relative z-20 flex flex-col w-72 h-full border-r border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 ease-in-out transform",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative md:translate-x-0 md:w-20 lg:w-72"
                )}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 p-6 border-b border-white/5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <BrainCircuit className="text-white" size={24} />
                    </div>
                    <h1 className={clsx("text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-400 tracking-tight", !isSidebarOpen && "hidden lg:block")}>
                        Arcpedia
                    </h1>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Main */}
                    <SidebarItem to="/" icon={HomeIcon} label="Home" />
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

                    <div className="pt-4 pb-2">
                        <p className={clsx("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", !isSidebarOpen && "hidden lg:block")}>ACADEMICS</p>
                    </div>
                    <SidebarItem to="/arc-table" icon={Calendar} label="Arc-Table" />
                    <SidebarItem to="/progress" icon={TrendingUp} label="Progress" />

                    <div className="pt-4 pb-2">
                        <p className={clsx("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", !isSidebarOpen && "hidden lg:block")}>LEARNING</p>
                    </div>
                    <SidebarItem to="/ai-resources" icon={Lightbulb} label="Archi" />
                    <SidebarItem to="/arc-reactor" icon={Atom} label="Arc Reactor" />
                    <SidebarItem to="/arc-book-lm" icon={BookOpen} label="Arc Book - LM" />

                    <div className="pt-4 pb-2">
                        <p className={clsx("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", !isSidebarOpen && "hidden lg:block")}>COMMUNITY</p>
                    </div>
                    <SidebarItem to="/peer-oracle" icon={PenTool} label="Peer Oracle" />
                    <SidebarItem to="/community-events" icon={CalendarDays} label="Events Pulse" />

                    <div className="pt-4 pb-2">
                        <p className={clsx("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", !isSidebarOpen && "hidden lg:block")}>WELLBEING</p>
                    </div>
                    <SidebarItem to="/memory-scroll" icon={History} label="Memory Scroll" />
                    <SidebarItem to="/daily-inspiration" icon={Sun} label="Daily Inspiration" />

                    <SidebarItem to="/laughing-arc" icon={Smile} label="Laughing Arc" />
                    <SidebarItem to="/temple-of-calm" icon={Wind} label="Temple of Calm" />

                    <div className="pt-4 pb-2">
                        <p className={clsx("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", !isSidebarOpen && "hidden lg:block")}>WANNA CHECK IQ ?</p>
                    </div>
                    <SidebarItem
                        to="/brainstorming"
                        state={{ game: 'sudoku' }}
                        icon={Grid3x3}
                        label="Sudoku"
                    />
                    <SidebarItem
                        to="/brainstorming"
                        state={{ game: '2048' }}
                        icon={Gamepad2}
                        label="2048"
                    />
                </div>

                {/* User User Profile Small */}
                <div className="p-4 border-t border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <img src={studentProfile.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-violet-500/50" />
                        <div className={clsx("overflow-hidden", !isSidebarOpen && "hidden lg:block")}>
                            <p className="text-sm font-medium text-white truncate">{studentProfile.name}</p>
                            <p className="text-xs text-slate-400 truncate">{studentProfile.major}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
                {/* Topbar */}
                <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors md:hidden"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                className="bg-slate-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-red-400">Stress: {vitals.stressLevel}%</span>
                        </div>

                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-slate-900"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-white/10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
