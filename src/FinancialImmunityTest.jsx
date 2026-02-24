import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, Activity, ChevronRight,
  Users, Shield, FlaskConical, Wallet, TrendingUp,
  CheckCircle2,
} from 'lucide-react';

// ─── Question bank — Filipino-English, PH-context aware ──────────────────────
const questions = [
  {
    id: 1,
    category: 'LIFE STAGE',
    icon: <Users className="w-10 h-10 text-blue-500 mb-5" />,
    text: 'Nasa anong yugto ka ng buhay mo?',
    subtitle: 'Where are you in your financial life stage? This helps us give you the right picture.',
    options: [
      { text: 'Single o bagong kasal – nagsisimula pa lang (20s–early 30s)', score: 20 },
      { text: 'May pamilya na, tumaas ang kita at gastos (30s–40s)', score: 15 },
      { text: 'Approaching retirement, thinking ahead (40s–50s)', score: 10 },
      { text: 'Near or at retirement – protecting what I\'ve built (50+)', score: 5 },
    ],
  },
  {
    id: 2,
    category: 'LIFE INSURANCE',
    icon: <Shield className="w-10 h-10 text-indigo-500 mb-5" />,
    text: 'Kung hindi ka na andito bukas, kaya ba ng pamilya mong mag-survive?',
    subtitle: 'Life insurance replaces your income for your family. Most experts recommend 5–10× your annual income.',
    options: [
      { text: 'Wala akong life insurance – hindi financially covered ang pamilya ko', score: 5 },
      { text: 'Meron pero hindi ko sure kung sapat – group or employer coverage lang', score: 12 },
      { text: 'May personal life insurance ako na at least 5–10× my annual income', score: 20 },
    ],
  },
  {
    id: 3,
    category: 'HEALTH COVERAGE',
    icon: <FlaskConical className="w-10 h-10 text-emerald-500 mb-5" />,
    text: 'Sa malaking ospital bill, sino ang magbabayad?',
    subtitle: 'Critical illness (cancer, stroke, heart attack) can cost ₱500K–₱3M in the Philippines. PhilHealth covers only a fraction.',
    options: [
      { text: 'PhilHealth lang — mataas ang out-of-pocket ko sa malaking sakit', score: 5 },
      { text: 'May HMO ako sa trabaho — pero mawawala kapag nagpalit o natanggal ako', score: 12 },
      { text: 'May HMO + critical illness rider/policy — covered kahit sa malubhang sakit', score: 20 },
    ],
  },
  {
    id: 4,
    category: 'EMERGENCY FUND',
    icon: <Wallet className="w-10 h-10 text-amber-500 mb-5" />,
    text: 'Kung mawalan ka ng trabaho ngayon, gaano katagal ang pamilya mo?',
    subtitle: 'An emergency fund in cash keeps your family afloat without borrowing. Target: 3–6 months of expenses.',
    options: [
      { text: '3–6+ months ng buwanang gastos — naka-ipon sa cash o liquid savings', score: 20 },
      { text: 'About 1–3 months lang — konti pa lang ang naitabi', score: 12 },
      { text: 'Wala pa — babala na kung may mangyari (less than 1 month)', score: 5 },
    ],
  },
  {
    id: 5,
    category: 'RETIREMENT',
    icon: <TrendingUp className="w-10 h-10 text-purple-500 mb-5" />,
    text: 'Bukod sa SSS o GSIS, may sariling retirement plan ka na ba?',
    subtitle: 'SSS/GSIS averages ₱6K–₱18K/month payout. Most Filipino families need 3–5× more to maintain their lifestyle.',
    options: [
      { text: 'Oo — may dedicated VUL, mutual fund, stocks, o retirement portfolio ako', score: 20 },
      { text: 'Nagtitipid minsan pero mostly umaasa sa SSS/GSIS pa rin', score: 10 },
      { text: 'Wala pa — umaasa sa SSS/GSIS, lotto, o mga anak', score: 5 },
    ],
  },
];

// ─── Score threshold per answer dot ──────────────────────────────────────────
// Q1: 20/15/10/5  Q2–Q4: 20/12/5  Q5: 20/10/5
// Using >= 18 for green, >= 10 for amber (covers Q5 middle score of 10)
function answerDotColor(pts) {
  if (pts >= 18) return { bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
  if (pts >= 10) return { bg: 'bg-amber-100',   dot: 'bg-amber-500' };
  return            { bg: 'bg-red-100',          dot: 'bg-red-500' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FinancialImmunityTest({ onContactClick }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (points, optionText) => {
    const next = score + points;
    setScore(next);
    setAnswers([...answers, { q: questions[currentStep].category, a: optionText, pts: points }]);
    if (currentStep < questions.length - 1) setCurrentStep(currentStep + 1);
    else setShowResult(true);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setScore(0);
    setShowResult(false);
    setAnswers([]);
  };

  const getDiagnosis = () => {
    if (score >= 80) return {
      label: 'Mataas ang Immunity', sublabel: 'High Financial Immunity',
      text: 'Maganda! Your family\'s financial foundation is strong. You\'re covering the major bases — life, health, emergency, and retirement. Keep building and reviewing annually.',
      color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      icon: <ShieldCheck className="w-16 h-16 text-emerald-600" />,
    };
    if (score >= 50) return {
      label: 'Katamtamang Immunity', sublabel: 'Moderate Financial Immunity',
      text: 'You\'re on your way, but may gaps in coverage — especially in healthcare, life insurance, or retirement beyond SSS/GSIS. A focused plan can plug these holes.',
      color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-700',
      icon: <Activity className="w-16 h-16 text-amber-600" />,
    };
    return {
      label: 'Mababang Immunity', sublabel: 'Low Financial Immunity',
      text: 'Maraming bukas na butas. Your family is exposed to major financial shocks — especially medical bills, income loss, and retirement. Let\'s build your protection layer.',
      color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-700',
      icon: <ShieldAlert className="w-16 h-16 text-red-600" />,
    };
  };

  const maxScore = questions.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.score)), 0);
  const scorePercent = Math.round((score / maxScore) * 100);
  const dx = getDiagnosis();

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* Header bar */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5">
          <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            PamilyaLab · Financial Immunity Test
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Safe ba ang pamilya mo?
          </h2>
          <p className="text-stone-300 text-sm mt-1">5 questions · 3 minutes · 100% private</p>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                {/* Step counter + progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-amber-600 uppercase tracking-widest">
                      {questions[currentStep].category}
                    </span>
                    <span className="text-xs text-stone-400">
                      {currentStep + 1} of {questions.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {questions.map((_, idx) => (
                      <div key={idx} className="h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: idx <= currentStep ? '100%' : '0%' }}
                          className={`h-full rounded-full ${
                            idx < currentStep  ? 'bg-amber-400' :
                            idx === currentStep ? 'bg-amber-600' : ''
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question */}
                <div className="text-center pt-2 pb-2">
                  <div className="flex justify-center">{questions[currentStep].icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight mb-3">
                    {questions[currentStep].text}
                  </h3>
                  <p className="text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
                    {questions[currentStep].subtitle}
                  </p>
                </div>

                {/* Privacy note */}
                <p className="text-xs text-stone-400 text-center -mt-2">
                  Your answers help assess your resilience — not judge your choices. 100% private.
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.score, option.text)}
                      className="w-full p-4 text-left rounded-2xl bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-all group flex justify-between items-center"
                    >
                      <span className="text-stone-700 font-medium text-sm sm:text-base group-hover:text-amber-900 leading-snug pr-3">
                        {option.text}
                      </span>
                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Score badge */}
                <div className={`rounded-2xl p-6 ${dx.bgColor} ${dx.borderColor} border-2 text-center`}>
                  <div className="flex justify-center mb-3">{dx.icon}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${dx.badgeColor}`}>
                    Score: {score} / {maxScore} ({scorePercent}%)
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-black ${dx.color} mb-1`}>{dx.label}</h3>
                  <p className="text-stone-500 text-xs mb-3">{dx.sublabel}</p>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                    {dx.text}
                  </p>
                </div>

                {/* Answer summary */}
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">
                    Your Answers
                  </p>
                  {answers.map((ans, i) => {
                    const { bg, dot } = answerDotColor(ans.pts);
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${bg}`}>
                          <div className={`w-2 h-2 rounded-full ${dot}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-stone-400 font-mono">{ans.q}</p>
                          <p className="text-sm text-stone-700 leading-snug">{ans.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="hidden md:block bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-stone-900 font-bold text-lg">
                      Gusto mo bang i-close ang mga gaps?
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                      Book a free consultation with PamilyaLab — a licensed Pru Life UK advisor will walk you through your next steps.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onContactClick}
                    className="cta-pulse w-full py-4 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all duration-200 text-base"
                  >
                    Simulan ang Free Consultation
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full py-2.5 px-4 rounded-xl text-sm text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    Ulit mula simula (Retake)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
