import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldPlus, Shield, HeartPulse, Wallet, Info } from 'lucide-react';
import { formatPHP } from './utils';
import { testimonials } from './testimonials';

// ─── NumericInput — local string state prevents "0 remains" on clear ─────────
function NumericInput({ value, onChange, placeholder, className, name }) {
  const [str, setStr] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    const local = str === '' ? 0 : Number(str);
    if (local !== value) setStr(value === 0 ? '' : String(value)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="number"
      min="0"
      value={str}
      onChange={(e) => { setStr(e.target.value); onChange(e); }}
      placeholder={placeholder}
      className={className}
      name={name}
      autoComplete="off"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GapCalculator({ onContactClick }) {
  const [monthlyIncome,       setMonthlyIncome]       = useState(60000);
  const [dependents,          setDependents]          = useState(2);
  const [replacementYears,    setReplacementYears]    = useState(10);
  const [existingLifeCoverage, setExistingLifeCoverage] = useState(0);
  const [existingHealthCoverage, setExistingHealthCoverage] = useState(0);
  const [currentEmergencyFund, setCurrentEmergencyFund] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Rotate testimonials every 5s
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // ── Calculations ────────────────────────────────────────────────────────────
  const lifeNeed      = monthlyIncome * 12 * replacementYears;
  const healthNeed    = dependents >= 2 ? 2_000_000 : (dependents >= 1 ? 1_500_000 : 1_000_000);
  const emergencyNeed = monthlyIncome * 6;

  const lifeGap      = Math.max(0, lifeNeed - existingLifeCoverage);
  const healthGap    = Math.max(0, healthNeed - existingHealthCoverage);
  const emergencyGap = Math.max(0, emergencyNeed - currentEmergencyFund);

  const lifePct      = lifeNeed > 0 ? Math.min(100, Math.round((existingLifeCoverage / lifeNeed) * 100)) : 100;
  const healthPct    = healthNeed > 0 ? Math.min(100, Math.round((existingHealthCoverage / healthNeed) * 100)) : 100;
  const emergencyPct = emergencyNeed > 0 ? Math.min(100, Math.round((currentEmergencyFund / emergencyNeed) * 100)) : 100;

  // ── Gap card helper ─────────────────────────────────────────────────────────
  const gapCards = [
    { id: 'GAP-001', label: 'LIFE', icon: Shield,      need: lifeNeed,      have: existingLifeCoverage, gap: lifeGap,      pct: lifePct },
    { id: 'GAP-002', label: 'HEALTH', icon: HeartPulse, need: healthNeed,    have: existingHealthCoverage, gap: healthGap,  pct: healthPct },
    { id: 'GAP-003', label: 'EMERGENCY', icon: Wallet,  need: emergencyNeed, have: currentEmergencyFund, gap: emergencyGap, pct: emergencyPct },
  ];

  const cardColor = (pct) => {
    if (pct >= 100) return { bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' };
    if (pct >= 50)  return { bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   text: 'text-amber-700' };
    return             { bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     text: 'text-red-700' };
  };

  const inputCls = "w-full bg-white border border-stone-200 text-stone-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors";

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5">
          <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            PamilyaLab · Coverage Gap Calculator
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Sapat ba ang proteksyon mo?
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            Find out exactly how much life insurance, health coverage, and emergency fund your family needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── Left: Inputs ─────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-stone-200 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <ShieldPlus className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                Your Family Profile
              </h3>
            </div>

            {/* Monthly Family Income */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">Monthly Family Income</label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(monthlyIncome)}</span>
              </div>
              <NumericInput
                name="monthlyIncome"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 60000"
                className={inputCls}
              />
              <p className="text-xs text-stone-400 mt-1.5">Combined household take-home pay per month</p>
            </div>

            {/* Number of Dependents */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="text-xs text-stone-500 font-medium block mb-2">Number of Dependents</label>
              <div className="text-3xl font-black text-blue-700 mb-3">{dependents}</div>
              <input
                type="range" min="0" max="6" value={dependents}
                name="dependents"
                autoComplete="off"
                onChange={(e) => setDependents(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>0</span><span>6</span>
              </div>
            </div>

            {/* Years of Income Replacement */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="text-xs text-stone-500 font-medium block mb-2">Years of Income Replacement</label>
              <div className="text-3xl font-black text-amber-600 mb-3">{replacementYears}</div>
              <input
                type="range" min="5" max="15" value={replacementYears}
                name="replacementYears"
                autoComplete="off"
                onChange={(e) => setReplacementYears(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>5 yrs</span><span>15 yrs</span>
              </div>
            </div>

            {/* Existing Life Insurance Coverage */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">Existing Life Insurance Coverage</label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(existingLifeCoverage)}</span>
              </div>
              <NumericInput
                name="existingLifeCoverage"
                value={existingLifeCoverage}
                onChange={(e) => setExistingLifeCoverage(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 1000000"
                className={inputCls}
              />
              <p className="text-xs text-stone-400 mt-1.5">Total face value of all life insurance policies</p>
            </div>

            {/* Existing Health/CI Coverage */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">Existing Health / CI Coverage</label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(existingHealthCoverage)}</span>
              </div>
              <NumericInput
                name="existingHealthCoverage"
                value={existingHealthCoverage}
                onChange={(e) => setExistingHealthCoverage(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 500000"
                className={inputCls}
              />
              <p className="text-xs text-stone-400 mt-1.5">HMO, PhilHealth top-up, critical illness riders</p>
            </div>

            {/* Current Emergency Fund */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">Current Emergency Fund</label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(currentEmergencyFund)}</span>
              </div>
              <NumericInput
                name="currentEmergencyFund"
                value={currentEmergencyFund}
                onChange={(e) => setCurrentEmergencyFund(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 180000"
                className={inputCls}
              />
              <p className="text-xs text-stone-400 mt-1.5">Liquid savings set aside for emergencies only</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Life insurance need = income x years. Health need scales by dependents. Emergency fund = 6 months of income.
              </p>
            </div>
          </div>

          {/* ── Right: Gap Cards ─────────────────────────────────────── */}
          <div className="p-6 sm:p-8 flex flex-col justify-center space-y-5">

            <p className="text-xs text-stone-400 font-mono uppercase tracking-widest mb-1">
              Coverage Gap Analysis
            </p>

            {gapCards.map((card) => {
              const Icon = card.icon;
              const color = cardColor(card.pct);
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-5 border-2 ${color.bg} ${color.border}`}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${color.text}`} />
                    <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                      {card.id} · {card.label}
                    </span>
                  </div>

                  {/* Need / Have */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Need</p>
                      <p className="text-sm font-bold text-blue-700">{formatPHP(card.need)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Have</p>
                      <p className="text-sm font-bold text-blue-700">{formatPHP(card.have)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className={`h-full rounded-full ${color.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${card.pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-stone-400 mb-2">
                    <span>{card.pct}% covered</span>
                  </div>

                  {/* Gap result */}
                  <div className="text-center">
                    {card.gap > 0 ? (
                      <p className={`text-lg font-black ${card.pct >= 50 ? 'text-amber-700' : 'text-red-600'}`}>
                        KULANG: {formatPHP(card.gap)}
                      </p>
                    ) : (
                      <p className="text-lg font-black text-emerald-700">
                        &#10003; COVERED
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* CTA */}
            <div className="hidden md:block bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center space-y-3">
              <p className="text-stone-900 font-bold text-base">
                Gusto mong i-close ang coverage gaps?
              </p>
              <p className="text-amber-700 text-xs leading-relaxed">
                A licensed PamilyaLab advisor can build a plan to close your gaps — for free.
              </p>
              {/* Testimonial */}
              <div className="py-2 min-h-[52px]">
                <p className="text-stone-500 text-xs italic leading-relaxed">
                  &ldquo;{testimonials[testimonialIdx].quote}&rdquo;
                </p>
                <p className="text-stone-400 text-[10px] mt-1 font-medium">
                  — {testimonials[testimonialIdx].name}, {testimonials[testimonialIdx].age}, {testimonials[testimonialIdx].city}
                </p>
              </div>
              <button
                type="button"
                onClick={onContactClick}
                className="cta-pulse w-full py-3.5 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all duration-200"
              >
                I-close ang Gaps — Libre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
