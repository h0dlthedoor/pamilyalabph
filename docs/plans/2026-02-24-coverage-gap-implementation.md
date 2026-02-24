# 5-Pillar Coverage Gap Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite GapCalculator.jsx from a simple side-by-side layout into a 3-step wizard with 5-pillar financial needs analysis (DIME life insurance, age-scaled health, income-adjusted emergency, inflation-adjusted education, retirement gap).

**Architecture:** Single-file rewrite of `src/GapCalculator.jsx`. Wizard state machine with `step` (0-2 = inputs, 3 = results). All formulas are pure derived state from input values. No new dependencies — uses existing React, Framer Motion, Lucide, and utils.js.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS 4, Lucide-react, existing `formatPHP`/`formatShort` from `src/utils.js`

**Design doc:** `docs/plans/2026-02-24-coverage-gap-redesign-design.md`

---

### Task 1: Create calculation engine (pure functions)

**Files:**
- Create: `src/gapCalculations.js`

**Step 1: Create the calculation module**

This file contains all 5 pillar formulas as pure functions plus constants. Separating logic from UI makes it testable and keeps the component clean.

```js
// src/gapCalculations.js
// 5-Pillar Financial Needs Analysis — Pure calculation engine

export const PH_INFLATION = 0.05;
export const EXPENSE_RATIO = 0.7;
export const RETIREMENT_REPLACEMENT = 0.7;
export const SSS_MONTHLY = 12000;
export const LIFE_EXPECTANCY = 85;
export const EDUCATION_COSTS = { state: 400000, private: 1200000, topTier: 2000000 };

// Sum of (1 + rate)^i for i=1..years — inflation-adjusted annuity factor
export function inflationFactor(years, rate = PH_INFLATION) {
  let sum = 0;
  for (let i = 1; i <= years; i++) sum += Math.pow(1 + rate, i);
  return sum;
}

// Clamp helper
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// Pillar 1: Life Insurance (DIME Method)
// need = Debts + InflationAdjustedIncome + Mortgage + EducationNeed
export function calcLife({ age, monthlyIncome, outstandingDebts, mortgageBalance, educationNeed }) {
  const replacementYears = clamp(65 - age, 5, 30);
  const factor = inflationFactor(replacementYears);
  const incomeNeed = monthlyIncome * 12 * factor;
  const need = outstandingDebts + incomeNeed + mortgageBalance + educationNeed;
  return { need, replacementYears };
}

// Pillar 2: Health / Critical Illness
export function calcHealth({ age, numberOfChildren }) {
  let baseNeed;
  if (age < 35)      baseNeed = 1500000;
  else if (age < 45) baseNeed = 2000000;
  else if (age < 55) baseNeed = 2500000;
  else               baseNeed = 3000000;
  const dependentAdd = Math.min(numberOfChildren, 3) * 500000;
  const need = baseNeed + dependentAdd;
  return { need, baseNeed, dependentAdd };
}

// Pillar 3: Emergency Fund
export function calcEmergency({ monthlyIncome, spouseWorking }) {
  const monthlyExpenses = monthlyIncome * EXPENSE_RATIO;
  const months = spouseWorking ? 6 : 9;
  const need = monthlyExpenses * months;
  return { need, months, monthlyExpenses };
}

// Pillar 4: Education Fund
export function calcEducation({ numberOfChildren, youngestChildAge, schoolType }) {
  if (numberOfChildren === 0) return { need: 0, inflatedCost: 0, yearsUntilCollege: 0, applicable: false };
  const costPerChild = EDUCATION_COSTS[schoolType] || EDUCATION_COSTS.state;
  const yearsUntilCollege = Math.max(0, 18 - youngestChildAge);
  const inflatedCost = Math.round(costPerChild * Math.pow(1 + PH_INFLATION, yearsUntilCollege));
  const need = inflatedCost * numberOfChildren;
  return { need, inflatedCost, yearsUntilCollege, applicable: true };
}

// Pillar 5: Retirement
export function calcRetirement({ monthlyIncome, retirementAge }) {
  const annualNeed = monthlyIncome * 12 * RETIREMENT_REPLACEMENT;
  const sssAnnual = SSS_MONTHLY * 12;
  const yearsInRetirement = Math.max(0, LIFE_EXPECTANCY - retirementAge);
  const annualGap = Math.max(0, annualNeed - sssAnnual);
  const factor = inflationFactor(yearsInRetirement);
  const need = annualGap * factor;
  return { need, annualNeed, yearsInRetirement, annualGap };
}

// Overall protection score (weighted average of pillar percentages)
// Education excluded from weighting when not applicable
export function calcOverallScore(pillars) {
  const active = pillars.filter(p => p.applicable !== false);
  if (active.length === 0) return 0;
  const totalPct = active.reduce((sum, p) => sum + Math.min(100, p.pct), 0);
  return Math.round(totalPct / active.length);
}
```

**Step 2: Verify no syntax errors**

Run: `node -c src/gapCalculations.js`
Expected: no output (syntax OK)

**Step 3: Commit**

```bash
git add src/gapCalculations.js
git commit -m "feat: add 5-pillar financial needs calculation engine"
```

---

### Task 2: Rewrite GapCalculator.jsx — State & Wizard Shell

**Files:**
- Rewrite: `src/GapCalculator.jsx`

**Step 1: Write the wizard state machine and step rendering shell**

Replace the entire file. This step sets up all input state, the 3-step wizard navigation, and placeholder step content. The results page is a placeholder until Task 3.

```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldPlus, Shield, HeartPulse, Wallet, GraduationCap, Landmark,
  Info, ChevronRight, ChevronLeft, Users, Briefcase, Home, CreditCard,
} from 'lucide-react';
import { formatPHP, formatShort } from './utils';
import { testimonials } from './testimonials';
import {
  calcLife, calcHealth, calcEmergency, calcEducation, calcRetirement,
  calcOverallScore, EDUCATION_COSTS,
} from './gapCalculations';

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

// ─── Wizard Steps Config ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'family',  label: 'ANG PAMILYA MO',        title: 'Family Profile' },
  { key: 'assets',  label: 'ANONG MERON KA NA?',     title: 'What You Have' },
  { key: 'goals',   label: 'MGA UTANG AT PANGARAP',  title: 'Debts & Goals' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GapCalculator({ onContactClick }) {
  // Step state
  const [step, setStep] = useState(0); // 0-2 = wizard, 3 = results

  // Step 1: Family Profile
  const [monthlyIncome, setMonthlyIncome] = useState(60000);
  const [age, setAge] = useState(30);
  const [spouseWorking, setSpouseWorking] = useState(false);
  const [numberOfChildren, setNumberOfChildren] = useState(2);
  const [youngestChildAge, setYoungestChildAge] = useState(5);

  // Step 2: What You Have
  const [existingLifeCoverage, setExistingLifeCoverage] = useState(0);
  const [existingHealthCoverage, setExistingHealthCoverage] = useState(0);
  const [emergencyFundSavings, setEmergencyFundSavings] = useState(0);
  const [educationSavings, setEducationSavings] = useState(0);
  const [retirementSavings, setRetirementSavings] = useState(0);

  // Step 3: Debts & Goals
  const [outstandingDebts, setOutstandingDebts] = useState(0);
  const [mortgageBalance, setMortgageBalance] = useState(0);
  const [schoolType, setSchoolType] = useState('private');
  const [retirementAge, setRetirementAge] = useState(60);

  // Testimonial rotation
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // ── Calculations (derived from state) ───────────────────────────────────────
  const education = calcEducation({ numberOfChildren, youngestChildAge, schoolType });
  const life = calcLife({ age, monthlyIncome, outstandingDebts, mortgageBalance, educationNeed: education.need });
  const health = calcHealth({ age, numberOfChildren });
  const emergency = calcEmergency({ monthlyIncome, spouseWorking });
  const retirement = calcRetirement({ monthlyIncome, retirementAge });

  const pillars = [
    { id: 'life',       label: 'Life Insurance',    icon: Shield,       need: life.need,       have: existingLifeCoverage,  ...life },
    { id: 'health',     label: 'Health / CI',       icon: HeartPulse,   need: health.need,     have: existingHealthCoverage, ...health },
    { id: 'emergency',  label: 'Emergency Fund',    icon: Wallet,       need: emergency.need,  have: emergencyFundSavings,  ...emergency },
    { id: 'education',  label: 'Education Fund',    icon: GraduationCap,need: education.need,  have: educationSavings,      ...education },
    { id: 'retirement', label: 'Retirement',        icon: Landmark,     need: retirement.need, have: retirementSavings,     ...retirement },
  ].map(p => ({
    ...p,
    gap: Math.max(0, p.need - p.have),
    pct: p.need > 0 ? Math.min(100, Math.round((p.have / p.need) * 100)) : (p.applicable === false ? 0 : 100),
  }));

  const overallScore = calcOverallScore(pillars);
  const totalGap = pillars.reduce((sum, p) => sum + p.gap, 0);
  const sortedPillars = [...pillars].sort((a, b) => a.pct - b.pct);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const restart = () => setStep(0);

  const inputCls = "w-full bg-white border border-stone-200 text-stone-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors";

  // ── Card color helper ───────────────────────────────────────────────────────
  const cardColor = (pct, applicable) => {
    if (applicable === false) return { bg: 'bg-stone-50', border: 'border-stone-200', bar: 'bg-stone-300', text: 'text-stone-400' };
    if (pct >= 100) return { bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' };
    if (pct >= 50)  return { bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   text: 'text-amber-700' };
    return             { bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     text: 'text-red-700' };
  };

  const scoreColor = overallScore >= 80 ? 'text-emerald-700' : overallScore >= 40 ? 'text-amber-700' : 'text-red-700';
  const scoreBg = overallScore >= 80 ? 'bg-emerald-50 border-emerald-200' : overallScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5">
          <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            PamilyaLab · 5-Pillar Needs Analysis
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Sapat ba ang proteksyon ng pamilya mo?
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            {step < 3 ? '3 steps · 5 minutes · Professional-grade analysis' : 'Your complete financial gap report'}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step < 3 ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                {/* ── Progress bar ──────────────────────────────────────── */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-amber-600 uppercase tracking-widest">
                      {STEPS[step].label}
                    </span>
                    <span className="text-xs text-stone-400">
                      Step {step + 1} of 3
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {STEPS.map((_, idx) => (
                      <div key={idx} className="h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: idx <= step ? '100%' : '0%' }}
                          className={`h-full rounded-full ${
                            idx < step  ? 'bg-amber-400' :
                            idx === step ? 'bg-amber-600' : ''
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Step 1: Family Profile ────────────────────────────── */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="text-center pt-2 pb-1">
                      <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-stone-900">Ang Pamilya Mo</h3>
                      <p className="text-sm text-stone-500 mt-1">Tell us about your family so we can calculate your needs.</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-medium text-stone-600">Monthly Family Income</label>
                        <span className="text-sm font-bold text-blue-700">{formatPHP(monthlyIncome)}</span>
                      </div>
                      <NumericInput name="monthlyIncome" value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="e.g. 60000" className={inputCls} />
                      <p className="text-xs text-stone-400 mt-1.5">Combined household take-home pay</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <label className="text-xs text-stone-500 font-medium block mb-2">Your Age</label>
                      <div className="text-3xl font-black text-blue-700 mb-3">{age}</div>
                      <input type="range" min="20" max="65" value={age} name="age" autoComplete="off"
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                        <span>20</span><span>65</span>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <label className="text-xs text-stone-500 font-medium block mb-2">Is your spouse working?</label>
                      <div className="flex gap-3">
                        {[{ val: true, label: 'Oo, may trabaho' }, { val: false, label: 'Hindi / Solo income' }].map(opt => (
                          <button key={String(opt.val)} type="button" onClick={() => setSpouseWorking(opt.val)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                              spouseWorking === opt.val
                                ? 'bg-amber-400 border-amber-400 text-stone-900'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-1.5">Affects how many months of emergency fund you need</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <label className="text-xs text-stone-500 font-medium block mb-2">Number of Children</label>
                      <div className="text-3xl font-black text-blue-700 mb-3">{numberOfChildren}</div>
                      <input type="range" min="0" max="6" value={numberOfChildren} name="children" autoComplete="off"
                        onChange={(e) => setNumberOfChildren(Number(e.target.value))}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                        <span>0</span><span>6</span>
                      </div>
                    </div>

                    {numberOfChildren > 0 && (
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <label className="text-xs text-stone-500 font-medium block mb-2">Youngest Child&apos;s Age</label>
                        <div className="text-3xl font-black text-amber-600 mb-3">{youngestChildAge}</div>
                        <input type="range" min="0" max="17" value={youngestChildAge} name="youngestAge" autoComplete="off"
                          onChange={(e) => setYoungestChildAge(Number(e.target.value))}
                          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                          <span>0 (newborn)</span><span>17</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 2: What You Have ─────────────────────────────── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center pt-2 pb-1">
                      <Briefcase className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-stone-900">Anong Meron Ka Na?</h3>
                      <p className="text-sm text-stone-500 mt-1">What financial protection do you currently have?</p>
                    </div>

                    {[
                      { label: 'Life Insurance (Face Value)', value: existingLifeCoverage, setter: setExistingLifeCoverage, hint: 'Total death benefit across all policies', icon: Shield, ph: 'e.g. 1000000' },
                      { label: 'Health / Critical Illness Coverage', value: existingHealthCoverage, setter: setExistingHealthCoverage, hint: 'HMO + CI riders + PhilHealth top-up', icon: HeartPulse, ph: 'e.g. 500000' },
                      { label: 'Emergency Fund (Liquid Savings)', value: emergencyFundSavings, setter: setEmergencyFundSavings, hint: 'Cash set aside for emergencies only', icon: Wallet, ph: 'e.g. 180000' },
                      { label: 'Education Savings', value: educationSavings, setter: setEducationSavings, hint: 'Savings earmarked for children\'s college', icon: GraduationCap, ph: 'e.g. 200000' },
                      { label: 'Retirement Savings', value: retirementSavings, setter: setRetirementSavings, hint: 'VUL, mutual funds, stocks, PERA, MP2', icon: Landmark, ph: 'e.g. 300000' },
                    ].map(field => {
                      const Icon = field.icon;
                      return (
                        <div key={field.label} className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-stone-400" /> {field.label}
                            </label>
                            <span className="text-sm font-bold text-blue-700">{formatPHP(field.value)}</span>
                          </div>
                          <NumericInput name={field.label} value={field.value}
                            onChange={(e) => field.setter(Math.max(0, Number(e.target.value) || 0))}
                            placeholder={field.ph} className={inputCls} />
                          <p className="text-xs text-stone-400 mt-1.5">{field.hint}</p>
                        </div>
                      );
                    })}

                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Hindi mo alam ang exact amounts? Okay lang — estimate mo muna. Mas mahalaga ang big picture kaysa exact na numero.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Debts & Goals ─────────────────────────────── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center pt-2 pb-1">
                      <Home className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-stone-900">Mga Utang at Pangarap</h3>
                      <p className="text-sm text-stone-500 mt-1">Your debts and goals shape how much life insurance you truly need.</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-stone-400" /> Outstanding Debts
                        </label>
                        <span className="text-sm font-bold text-blue-700">{formatPHP(outstandingDebts)}</span>
                      </div>
                      <NumericInput name="debts" value={outstandingDebts}
                        onChange={(e) => setOutstandingDebts(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="e.g. 200000" className={inputCls} />
                      <p className="text-xs text-stone-400 mt-1.5">Credit cards, car loans, personal loans</p>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-stone-400" /> Mortgage / Housing Loan Balance
                        </label>
                        <span className="text-sm font-bold text-blue-700">{formatPHP(mortgageBalance)}</span>
                      </div>
                      <NumericInput name="mortgage" value={mortgageBalance}
                        onChange={(e) => setMortgageBalance(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="e.g. 1500000" className={inputCls} />
                      <p className="text-xs text-stone-400 mt-1.5">Remaining balance on home loan (Pag-IBIG, bank)</p>
                    </div>

                    {numberOfChildren > 0 && (
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <label className="text-xs text-stone-500 font-medium block mb-2">Target School Type</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {[
                            { val: 'state', label: 'State Univ', sub: formatShort(EDUCATION_COSTS.state) },
                            { val: 'private', label: 'Private', sub: formatShort(EDUCATION_COSTS.private) },
                            { val: 'topTier', label: 'Top-Tier', sub: formatShort(EDUCATION_COSTS.topTier) },
                          ].map(opt => (
                            <button key={opt.val} type="button" onClick={() => setSchoolType(opt.val)}
                              className={`flex-1 py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                                schoolType === opt.val
                                  ? 'bg-amber-400 border-amber-400 text-stone-900'
                                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'
                              }`}>
                              <span className="block">{opt.label}</span>
                              <span className="text-[10px] opacity-70">{opt.sub} / 4 yrs</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-stone-400 mt-1.5">Education cost per child (4-year degree)</p>
                      </div>
                    )}

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <label className="text-xs text-stone-500 font-medium block mb-2">Target Retirement Age</label>
                      <div className="text-3xl font-black text-purple-600 mb-3">{retirementAge}</div>
                      <input type="range" min="50" max="70" value={retirementAge} name="retirementAge" autoComplete="off"
                        onChange={(e) => setRetirementAge(Number(e.target.value))}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                        <span>50</span><span>70</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1.5">We plan your fund to last until age 85</p>
                    </div>
                  </div>
                )}

                {/* ── Nav buttons ───────────────────────────────────────── */}
                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <button type="button" onClick={goBack}
                      className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button type="button" onClick={goNext}
                    className="cta-pulse flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all text-sm">
                    {step < 2 ? (
                      <>Next <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>Ipakita ang Results <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Results Page (step === 3) ──────────────────────────── */
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                {/* Overall Score */}
                <div className={`rounded-2xl p-6 border-2 text-center ${scoreBg}`}>
                  <p className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-2">Overall Protection Score</p>
                  <p className={`text-5xl font-black ${scoreColor}`}>{overallScore}%</p>
                  <p className="text-sm text-stone-600 mt-2 font-medium">
                    {overallScore >= 80 ? 'Malakas ang proteksyon mo!' :
                     overallScore >= 40 ? 'May mga gaps pa — kaya pang i-improve.' :
                     'Maraming butas — kailangan ng action plan.'}
                  </p>
                  {totalGap > 0 && (
                    <p className="text-xs text-stone-500 mt-2">
                      Kabuuang kulang: <span className="font-bold text-stone-700">{formatShort(totalGap)}</span>
                    </p>
                  )}
                </div>

                {/* Pillar Cards — sorted by priority */}
                <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">
                  5-Pillar Gap Analysis
                </p>

                {sortedPillars.map((p, idx) => {
                  const Icon = p.icon;
                  const color = cardColor(p.pct, p.applicable);
                  const isFirst = idx === 0 && p.gap > 0;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`rounded-2xl p-5 border-2 ${color.bg} ${color.border} ${p.applicable === false ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-5 h-5 ${color.text}`} />
                        <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                          {p.label}
                        </span>
                        {isFirst && (
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            Unahin mo ito
                          </span>
                        )}
                        {p.applicable === false && (
                          <span className="ml-auto text-[10px] text-stone-400 font-medium">N/A</span>
                        )}
                      </div>

                      {p.applicable !== false && (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Need</p>
                              <p className="text-sm font-bold text-blue-700">{formatPHP(p.need)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Have</p>
                              <p className="text-sm font-bold text-blue-700">{formatPHP(p.have)}</p>
                            </div>
                          </div>

                          <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-3">
                            <motion.div
                              className={`h-full rounded-full ${color.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${p.pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs text-stone-400 mb-2">
                            <span>{p.pct}% covered</span>
                          </div>

                          <div className="text-center">
                            {p.gap > 0 ? (
                              <p className={`text-lg font-black ${p.pct >= 50 ? 'text-amber-700' : 'text-red-600'}`}>
                                KULANG: {formatPHP(p.gap)}
                              </p>
                            ) : (
                              <p className="text-lg font-black text-emerald-700">&#10003; COVERED</p>
                            )}
                          </div>
                        </>
                      )}
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
                  <div className="py-2 min-h-[52px]">
                    <p className="text-stone-500 text-xs italic leading-relaxed">
                      &ldquo;{testimonials[testimonialIdx].quote}&rdquo;
                    </p>
                    <p className="text-stone-400 text-[10px] mt-1 font-medium">
                      — {testimonials[testimonialIdx].name}, {testimonials[testimonialIdx].age}, {testimonials[testimonialIdx].city}
                    </p>
                  </div>
                  <button type="button" onClick={onContactClick}
                    className="cta-pulse w-full py-3.5 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all duration-200">
                    I-close ang Gaps — Libre
                  </button>
                </div>

                {/* Restart */}
                <button type="button" onClick={restart}
                  className="w-full py-2.5 px-4 rounded-xl text-sm text-stone-500 hover:text-stone-700 transition-colors">
                  Ulit mula simula (Recalculate)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify dev server**

Run: `npm run dev`
Expected: No errors, Coverage Gap tab loads with Step 1 wizard

**Step 3: Commit**

```bash
git add src/GapCalculator.jsx
git commit -m "feat: rewrite GapCalculator as 5-pillar step-by-step wizard"
```

---

### Task 3: Lint cleanup

**Files:**
- Modify: `src/GapCalculator.jsx` (if needed)
- Modify: `src/gapCalculations.js` (if needed)

**Step 1: Run lint**

Run: `npm run lint`

Fix any new errors introduced by the rewrite. Pre-existing `motion` unused-var errors across all files are expected and should be ignored.

**Step 2: Commit fixes**

```bash
git add -A
git commit -m "fix: lint cleanup for gap calculator rewrite"
```

---

### Task 4: Verify full app integration

**Step 1: Manual verification checklist**

Run `npm run dev` and test:

1. Navigate to Coverage Gap tab
2. Step 1: Change income, age, spouse toggle, children count, youngest age
3. Click Next → Step 2 shows 5 "What You Have" inputs
4. Click Next → Step 3 shows debts, mortgage, school type, retirement age
5. Click "Ipakita ang Results" → Results page shows:
   - Overall protection score with color
   - 5 pillar cards sorted by priority (lowest % first)
   - "Unahin mo ito" badge on worst pillar
   - Total gap summary
   - CTA + testimonials
6. Set children to 0 → Education pillar shows N/A greyed out
7. "Recalculate" button returns to Step 1
8. Back button works on Steps 2 and 3
9. Mobile: check all steps render correctly at 375px width
10. Other tabs (Immunity Test, Kumunsulta, Admin) still work

**Step 2: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "fix: final tweaks from manual verification"
```
