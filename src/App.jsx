import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Timer, Microscope, Beaker } from 'lucide-react';
import PetriDishPortfolio from './PetriDishPortfolio';
import FinancialImmunityTest from './FinancialImmunityTest';
import ExpirationCalculator from './ExpirationCalculator';
import { supabase } from './lib/supabase';

// Fixed profile key — single-user lab, no auth required yet
const PROFILE_KEY = 'kris-primary';

export default function App() {
  const [activeTab, setActiveTab] = useState('immunity');
  const [dbStatus, setDbStatus] = useState('idle'); // 'idle' | 'loading' | 'saving' | 'saved' | 'error'

  // ── Shared specimen state (Portfolio Dashboard → Savings Runway) ─────────
  const [specimenData, setSpecimenData] = useState({
    cash: 0,
    emergencyFund: 0,
    healthCoverage: 0,
    retirementInvestments: 0,
  });

  // ── Load latest snapshot on mount ───────────────────────────────────────
  useEffect(() => {
    async function loadPortfolio() {
      setDbStatus('loading');
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('cash, emergency_fund, health_coverage, retirement_investments')
        .eq('profile_key', PROFILE_KEY)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = row not found (first run), anything else is a real error
        console.error('Supabase load error:', error);
        setDbStatus('error');
        return;
      }

      if (data) {
        setSpecimenData({
          cash:                  data.cash,
          emergencyFund:         data.emergency_fund,
          healthCoverage:        data.health_coverage,
          retirementInvestments: data.retirement_investments,
        });
      }
      setDbStatus('idle');
    }

    loadPortfolio();
  }, []);

  // ── Save / upsert to Supabase ────────────────────────────────────────────
  const savePortfolio = useCallback(async () => {
    setDbStatus('saving');
    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert(
        {
          profile_key:            PROFILE_KEY,
          cash:                   specimenData.cash,
          emergency_fund:         specimenData.emergencyFund,
          health_coverage:        specimenData.healthCoverage,
          retirement_investments: specimenData.retirementInvestments,
          updated_at:             new Date().toISOString(),
        },
        { onConflict: 'profile_key' }
      );

    if (error) {
      console.error('Supabase save error:', error);
      setDbStatus('error');
    } else {
      setDbStatus('saved');
      setTimeout(() => setDbStatus('idle'), 2500);
    }
  }, [specimenData]);

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
    <div className="min-h-screen bg-stone-50 bg-noise flex flex-col font-sans text-stone-900 selection:bg-amber-200 overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-stone-200 shadow-sm sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-18">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Beaker className="w-7 h-7 text-amber-500" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  Kris | PamilyaLab
                </h1>
                <p className="text-[10px] text-amber-500 tracking-widest uppercase font-mono leading-tight">
                  Financial Pathology Laboratory
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-mono text-emerald-600 uppercase tracking-wider ml-1">
                Lab Certified
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:flex-nowrap bg-stone-100 p-1.5 rounded-2xl border border-stone-200 min-w-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 sm:px-5 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-all duration-300 shrink-0 ${
                    activeTab === item.id
                      ? 'text-amber-700'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white border border-stone-200 rounded-xl shadow-sm shadow-amber-100"
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
      <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden relative z-10">
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
                  onSave={savePortfolio}
                  dbStatus={dbStatus}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global footer */}
        <footer className="shrink-0 border-t border-stone-200 bg-white/80 backdrop-blur-sm px-4 py-4 text-center">
          <p className="text-sm text-stone-600 font-medium">
            Built with care for Filipino families by{' '}
            <span className="font-bold text-stone-800">Kris Jenelyn De Las Peñas</span>
            <span className="text-amber-500 mx-1.5">♥</span>
            <span className="text-stone-400 font-normal">Licensed Microbiologist · Pru Life UK Financial Advisor</span>
          </p>
          <p className="text-[10px] text-stone-400 mt-1 tracking-wide">
            © 2026 · For educational purposes only · Calculations are illustrative and not financial advice
          </p>
        </footer>
      </main>
    </div>
  );
}
