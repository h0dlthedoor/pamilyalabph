import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, Calculator } from 'lucide-react';
import { formatPHP } from './utils';
import { testimonials } from './testimonials';

// ─── NumericInput — local string state prevents "0 remains" on clear ─────────
function NumericInput({ value, onChange, placeholder, className }) {
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
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExpirationCalculator({ portfolioTotal = 0, onContactClick }) {
  const [currentAge,      setCurrentAge]      = useState(35);
  const [targetAge,       setTargetAge]       = useState(85);
  const [startingCapital, setStartingCapital] = useState(portfolioTotal > 0 ? portfolioTotal : 3000000);
  const [monthlyExpense,  setMonthlyExpense]  = useState(60000);
  const [inflationRate,   setInflationRate]   = useState(5);
  const [growthRate,      setGrowthRate]      = useState(6);
  const [showAdvanced,    setShowAdvanced]    = useState(false);
  const manualOverride    = useRef(false);
  const [testimonialIdx, setTestimonialIdx]   = useState(0);

  // Auto-sync portfolio total → starting capital (unless user manually edited)
  useEffect(() => {
    if (portfolioTotal > 0 && !manualOverride.current) {
      setStartingCapital(portfolioTotal);
    }
  }, [portfolioTotal]);

  // Rotate testimonials every 5s
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // ── Calculation ─────────────────────────────────────────────────────────────
  // Convert annual rates to monthly using compound formula
  const mInflation = Math.pow(1 + inflationRate / 100, 1 / 12) - 1;
  const mGrowth    = Math.pow(1 + growthRate    / 100, 1 / 12) - 1;

  const calculateDepletion = () => {
    let bal = Math.max(0, startingCapital || 0);
    let exp = Math.max(0, monthlyExpense  || 0);
    if (bal <= 0 || exp <= 0) return { months: 0, depleted: false };
    const maxMonths = Math.max(0, (120 - currentAge) * 12);
    for (let m = 0; m < maxMonths; m++) {
      bal = bal * (1 + mGrowth) - exp;
      if (bal <= 0) return { months: m + 1, depleted: true };
      exp = exp * (1 + mInflation);
    }
    return { months: maxMonths, depleted: false };
  };

  const { months, depleted } = calculateDepletion();
  const yearsRunway  = months / 12;
  const depletionAge = currentAge + yearsRunway;
  const yearsShort   = depleted ? Math.round(targetAge - depletionAge) : 0;
  const onTrack      = !depleted;
  const hasData      = startingCapital > 0 && monthlyExpense > 0;

  const totalHorizon   = Math.max(1, targetAge - currentAge);
  const coveredYears   = !hasData || !depleted ? totalHorizon : Math.max(0, Math.min(totalHorizon, yearsRunway));
  const barPercent     = Math.min(100, Math.max(0, (coveredYears / totalHorizon) * 100));

  const resultAge    = depleted ? depletionAge.toFixed(0) : `${targetAge}+`;
  const resultYears  = depleted ? Math.round(yearsRunway) : Math.round(totalHorizon);
  const currentYear  = new Date().getFullYear();
  const depletionYear = Math.round(currentYear + yearsRunway);

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5">
          <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            PamilyaLab · Savings Runway Calculator
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Gaano katagal ang savings mo?
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            How long will your money last — based on your real numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── Left: Inputs ─────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-stone-200 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                Tell Us About Your Money
              </h3>
            </div>

            {/* Ages */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <label className="text-xs text-stone-500 font-medium block mb-2">Your Age Today</label>
                <div className="text-3xl font-black text-blue-700 mb-3">{currentAge}</div>
                <input
                  type="range" min="20" max="70" value={currentAge}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setCurrentAge(v);
                    if (v >= targetAge) setTargetAge(v + 5);
                  }}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <label className="text-xs text-stone-500 font-medium block mb-2">Money should last until age…</label>
                <div className="text-3xl font-black text-amber-600 mb-3">{targetAge}</div>
                <input
                  type="range" min={currentAge + 1} max="100" value={targetAge}
                  onChange={(e) => setTargetAge(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* Capital */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">
                  Total Savings &amp; Investments Today
                </label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(startingCapital)}</span>
              </div>
              <NumericInput
                value={startingCapital}
                onChange={(e) => { manualOverride.current = true; setStartingCapital(Math.max(0, Number(e.target.value) || 0)); }}
                placeholder="e.g. 3000000"
                className="w-full bg-white border border-stone-200 text-stone-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
              <p className="text-xs text-stone-400 mt-1.5">Include bank savings, investments, insurance cash value</p>
              {portfolioTotal > 0 && (
                <button
                  type="button"
                  onClick={() => { manualOverride.current = false; setStartingCapital(portfolioTotal); }}
                  className={`mt-2 w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border ${
                    startingCapital === portfolioTotal
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                  }`}
                >
                  {startingCapital === portfolioTotal
                    ? '✓ Synced from My Portfolio'
                    : `Sync from My Portfolio: ${formatPHP(portfolioTotal)}`}
                </button>
              )}
            </div>

            {/* Monthly Expense */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-600">
                  Monthly Family Expenses
                </label>
                <span className="text-sm font-bold text-blue-700">{formatPHP(monthlyExpense)}</span>
              </div>
              <NumericInput
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 60000"
                className="w-full bg-white border border-stone-200 text-stone-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
              />
              <p className="text-xs text-stone-400 mt-1.5">Rent/mortgage, food, utilities, kids' tuition, etc.</p>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-stone-500 hover:text-amber-600 transition-colors font-medium"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced: Inflation &amp; Growth Rate Assumptions
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4 overflow-hidden"
              >
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-stone-500">Annual Inflation</label>
                    <span className="text-xs font-mono font-bold text-red-600">{inflationRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range" min="2" max="10" step="0.5" value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">PH average ~5%</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-stone-500">Investment Growth</label>
                    <span className="text-xs font-mono font-bold text-emerald-600">{growthRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range" min="2" max="12" step="0.5" value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Conservative ~6%</p>
                </div>
              </motion.div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Assumes savings grow while you withdraw. Inflation increases your monthly needs over time. Adjust assumptions as needed.
              </p>
            </div>
          </div>

          {/* ── Right: Result ─────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 flex flex-col justify-center space-y-5">

            {/* The big answer */}
            <div>
              <p className="text-xs text-stone-400 font-mono uppercase tracking-widest mb-3">
                Your Savings Runway
              </p>

              <div className={`rounded-2xl p-6 text-center border-2 ${
                !hasData ? 'bg-stone-50 border-stone-200' :
                onTrack  ? 'bg-emerald-50 border-emerald-200' :
                           'bg-red-50 border-red-200'
              }`}>
                {!hasData ? (
                  <p className="text-stone-400 text-sm">Fill in your numbers on the left to see your runway.</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-stone-500 mb-1">
                      Your money will last until you're…
                    </p>
                    <motion.div
                      key={resultAge}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-7xl font-black tracking-tighter mb-1 ${
                        onTrack ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {resultAge}
                    </motion.div>
                    <p className={`text-base font-semibold ${onTrack ? 'text-emerald-600' : 'text-red-500'}`}>
                      years old
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      {depleted
                        ? `That's ~${resultYears} years of runway (until around ${depletionYear})`
                        : `Fully funded beyond your goal of age ${targetAge}!`}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Timeline visual */}
            {hasData && (
              <div>
                <div className="flex justify-between text-xs text-stone-400 mb-1.5 font-mono">
                  <span>Age {currentAge}<br /><span className="text-[10px]">Today</span></span>
                  {depleted && depletionAge < targetAge && (
                    <span className="text-red-500 text-center">
                      Age {depletionAge.toFixed(0)}<br /><span className="text-[10px]">Money runs out</span>
                    </span>
                  )}
                  <span className="text-right">Age {targetAge}<br /><span className="text-[10px]">Your goal</span></span>
                </div>
                <div className="h-5 bg-stone-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full relative overflow-hidden ${
                      onTrack
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 via-amber-500 to-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Gap / On-track callout */}
            {hasData && depleted && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-bold text-sm">
                    Kulang ng {yearsShort} {yearsShort === 1 ? 'year' : 'years'}
                  </p>
                  <p className="text-red-600 text-xs mt-1 leading-relaxed">
                    Your savings run out around age {depletionAge.toFixed(0)}, which is {yearsShort} years
                    before your goal of age {targetAge}. Consider increasing savings,
                    reducing monthly expenses, or investing for higher returns.
                  </p>
                </div>
              </div>
            )}

            {hasData && onTrack && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-800 font-bold text-sm">On Track!</p>
                  <p className="text-emerald-600 text-xs mt-1 leading-relaxed">
                    Based on your inputs, your savings are projected to outlast your goal of age {targetAge}.
                    Maintaining your current savings rate keeps your family financially secure.
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="hidden md:block bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center space-y-3">
              <p className="text-stone-900 font-bold text-base">
                Gusto mong mapabilis ang runway mo?
              </p>
              <p className="text-amber-700 text-xs leading-relaxed">
                A licensed PamilyaLab consultant can show you how to grow your savings faster and close the gap — for free.
              </p>
              {/* Testimonial */}
              <div className="py-2 min-h-[52px]">
                <p className="text-stone-500 text-xs italic leading-relaxed">
                  "{testimonials[testimonialIdx].quote}"
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
                Book a Free Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
