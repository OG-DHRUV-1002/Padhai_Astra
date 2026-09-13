import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ArchiHub from './pages/ArchiHub';

import ArcReactor from './pages/ArcReactor';
import QuizInterface from './pages/QuizInterface';
import PeerOracle from './pages/PeerOracle';
import EventsPulse from './pages/EventsPulse';
import MemoryScroll from './pages/MemoryScroll';
import DailyInspiration from './pages/DailyInspiration';

import TempleOfCalm from './pages/TempleOfCalm';
import LaughingArc from './pages/LaughingArc';
import BrainstormingHub from './pages/BrainstormingHub';
import ArcTable from './pages/ArcTable';
import Progress from './pages/Progress';
import ArcBookLM from './pages/ArcBookLM';

// Placeholder Components for routes to be implemented
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
    <p>Module coming soon.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <StudentProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Academics */}
            <Route path="/arc-table" element={<ArcTable />} />
            <Route path="/progress" element={<Progress />} />

            {/* Learning Module */}
            <Route path="/ai-resources" element={<ArchiHub />} />
            <Route path="/arc-reactor" element={<ArcReactor />} />
            <Route path="/arc-book-lm" element={<ArcBookLM />} />
            <Route path="/quiz-interface" element={<QuizInterface />} />


            {/* Community Module */}
            <Route path="/peer-oracle" element={<PeerOracle />} />
            <Route path="/community-events" element={<EventsPulse />} />

            {/* Wellbeing Module */}
            <Route path="/memory-scroll" element={<MemoryScroll />} />
            <Route path="/daily-inspiration" element={<DailyInspiration />} />

            <Route path="/temple-of-calm" element={<TempleOfCalm />} />
            <Route path="/laughing-arc" element={<LaughingArc />} />

            {/* Brainstorming Module (Hidden from sidebar but accessible) */}
            <Route path="/brainstorming" element={<BrainstormingHub />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StudentProvider>
    </BrowserRouter>
  );
}

export default App;
