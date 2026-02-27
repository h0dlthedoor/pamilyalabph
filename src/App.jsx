import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Beaker, UserPlus, Settings, Lock, X, Loader2, ShieldPlus } from 'lucide-react';
import { playChime } from './sounds';
import FinancialImmunityTest from './FinancialImmunityTest';
import GapCalculator from './GapCalculator';
import ClientInquiryForm from './ClientInquiryForm';
import AdminPanel from './AdminPanel';
import ContactModal from './ContactModal';
import { supabase } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('immunity');
  const [showContact, setShowContact] = useState(false);
  const [immunityData, setImmunityData] = useState(null);
  const [gapData, setGapData] = useState(null);

  // ── Auth state ────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginLoading(false);
    if (error) {
      setLoginError(error.message);
    } else {
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      setActiveTab('admin');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveTab('immunity');
  };

  // ── Escape key closes modals ────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showLogin) setShowLogin(false);
        if (showContact) setShowContact(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showLogin, showContact]);

  // ── Nav items (admin only when authenticated) ─────────────────────────────
  const navItems = [
    { id: 'immunity', label: 'Immunity Test',  icon: <Activity   className="w-4 h-4" /> },
    { id: 'gap',      label: 'Coverage Gap',   icon: <ShieldPlus className="w-4 h-4" /> },
    { id: 'inquire',  label: 'Inquire',         icon: <UserPlus   className="w-4 h-4" /> },
    ...(session ? [{ id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-stone-50 bg-noise flex flex-col font-sans text-stone-900 selection:bg-amber-200 overflow-x-hidden">

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      {/* ── Login Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogin(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10"
              initial={{ scale: 0.9, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 24 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-6 py-5 relative">
                <button
                  onClick={() => setShowLogin(false)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <p className="text-amber-400 text-[10px] font-mono uppercase tracking-widest leading-tight">
                  PamilyaLab · Admin
                </p>
                <h3 className="text-white font-bold text-lg leading-tight">
                  Sign In
                </h3>
              </div>
              <form onSubmit={handleLogin} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border-2 border-stone-200 text-stone-800 px-4 py-3 rounded-xl text-sm font-medium focus-visible:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border-2 border-stone-200 text-stone-800 px-4 py-3 rounded-xl text-sm font-medium focus-visible:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                    required
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {loginError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-stone-200 shadow-sm sticky top-0 z-50 shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-18">

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Beaker className="w-7 h-7 text-amber-500" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  Kris | PamilyaLab
                </h1>
                <p className="text-[10px] text-amber-500 tracking-widest uppercase font-mono leading-tight">
                  Financial Health Laboratory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation Tabs */}
              <div className="hidden md:flex flex-wrap gap-1.5 sm:flex-nowrap bg-stone-100 p-1.5 rounded-2xl border border-stone-200 min-w-0">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative px-4 sm:px-5 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors duration-300 shrink-0 ${
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

              {/* Auth button */}
              {!session ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="touch-feedback flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border bg-stone-100 text-stone-500 border-stone-200 hover:text-stone-700 hover:bg-stone-200"
                  title="Admin Login"
                  aria-label="Admin Login"
                >
                  <Lock className="w-4 h-4" />
                </button>
              ) : (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-mono text-emerald-600 uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden relative z-10">
        <div className="flex-1 min-h-0 overflow-auto pb-40 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="h-full min-h-full py-6"
            >
              {activeTab === 'immunity' && (
                <FinancialImmunityTest onComplete={setImmunityData} />
              )}
              {activeTab === 'gap' && (
                <GapCalculator onComplete={setGapData} />
              )}
              {activeTab === 'inquire' && (
                <ClientInquiryForm immunityData={immunityData} gapData={gapData} />
              )}
              {activeTab === 'admin' && session && (
                <AdminPanel session={session} onSignOut={handleSignOut} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global footer */}
        <footer className="shrink-0 border-t border-stone-200 bg-white/80 backdrop-blur-sm px-4 py-4 text-center no-print">
          <p className="text-sm text-stone-600 font-medium">
            Built with care for Filipino families by{' '}
            <span className="font-bold text-stone-800">Kris Jenelyn De Las Peñas</span>
            <span className="text-amber-500 mx-1.5">♥</span>
            <span className="text-stone-400 font-normal">Microbiologist · Pru Life UK Financial Advisor</span>
          </p>
          <p className="text-[10px] text-stone-400 mt-1 tracking-wide">
            © 2026 · For educational purposes only · Calculations are illustrative and not financial advice
          </p>
        </footer>
      </main>

      {/* ── Mobile Bottom Bar ───────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 no-print">
        <div className="h-8 bg-gradient-to-t from-stone-50 to-transparent pointer-events-none" />
        <div className="bg-white/95 backdrop-blur-sm border-t border-stone-200 px-4 pt-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-around mb-2.5">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`touch-feedback flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl ${
                  activeTab === item.id ? 'text-amber-600 bg-amber-50' : 'text-stone-400'
                }`}>
                {item.icon}
                <span className="text-[9px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { playChime(); setShowContact(true); }}
            className="touch-feedback cta-pulse w-full py-3.5 rounded-2xl font-bold text-stone-900 bg-amber-400 text-sm shadow-md active:scale-95">
            Book Free Consultation
          </button>
        </div>
      </div>
    </div>
  );
}
