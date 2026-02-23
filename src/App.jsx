import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Timer, Microscope, Beaker } from 'lucide-react';
import PetriDishPortfolio from './PetriDishPortfolio';
import FinancialImmunityTest from './FinancialImmunityTest';
import ExpirationCalculator from './ExpirationCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState('immunity');

  // ── Shared specimen state (Portfolio Dashboard → Savings Runway) ─────────
  const [specimenData, setSpecimenData] = useState({
    cash: 0,
    emergencyFund: 0,
    healthCoverage: 0,
    retirementInvestments: 0,
  });

  const portfolioTotal =
    specimenData.cash +
    specimenData.emergencyFund +
    specimenData.healthCoverage +
    specimenData.retirementInvestments;

  const navItems = [
    { id: 'immunity',   label: 'Immunity Test',  icon: <Activity   className="w-4 h-4" /> },
    { id: 'expiration', label: 'Savings Runway', icon: <Timer      className="w-4 h-4" /> },
    { id: 'petri',      label: 'My Portfolio',   icon: <Microscope className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 bg-noise flex flex-col font-sans text-slate-900 selection:bg-blue-200 overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-18">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Beaker className="w-7 h-7 text-blue-700" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-blue-900 leading-tight">
                  Kris | PamilyaLab
                </h1>
                <p className="text-[10px] text-blue-400 tracking-widest uppercase font-mono leading-tight">
                  Financial Health Lab
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:flex-nowrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 min-w-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 sm:px-5 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-all duration-300 shrink-0 ${
                    activeTab === item.id
                      ? 'text-blue-700'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white border border-slate-200 rounded-xl shadow-sm shadow-blue-100"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {item.icon} {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="h-full min-h-full py-6"
            >
              {activeTab === 'immunity'   && <FinancialImmunityTest />}
              {activeTab === 'expiration' && <ExpirationCalculator portfolioTotal={portfolioTotal} />}
              {activeTab === 'petri'      && (
                <PetriDishPortfolio
                  specimenData={specimenData}
                  setSpecimenData={setSpecimenData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global footer */}
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-center">
          <p className="text-xs text-slate-400 max-w-2xl mx-auto">
            © 2026 Kris Jenelyn De Las Peñas. All Rights Reserved. &nbsp;•&nbsp;
            For educational purposes only. Calculations are illustrative and not financial advice. &nbsp;•&nbsp;
            Secure &amp; Private — data stays on your device.
          </p>
        </footer>
      </main>
    </div>
  );
}
