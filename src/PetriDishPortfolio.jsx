import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Microscope, CheckCircle2, AlertCircle, AlertTriangle, Clock,
  Dna, FlaskConical, Save, Loader2, CloudOff, Download,
} from 'lucide-react';
import { formatPHP, formatShort } from './utils';

// ─── NumericInput — local string state prevents "0 remains" on clear ─────────
function NumericInput({ value, onChange, className, placeholder, style, onFocus, onBlur }) {
  const [str, setStr] = React.useState(value === 0 ? '' : String(value));

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
      className={className}
      placeholder={placeholder}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

// ─── Arc helpers ──────────────────────────────────────────────────────────────
function arcPath(cx, cy, r, percent) {
  if (percent >= 99.9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
  }
  if (percent <= 0) return '';
  const angle = (percent / 100) * 2 * Math.PI;
  const endX  = cx + r * Math.sin(angle);
  const endY  = cy - r * Math.cos(angle);
  const large = percent > 50 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`;
}

function sectorPath(cx, cy, r, percent) {
  if (percent >= 99.9) {
    return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  }
  if (percent <= 0) return '';
  const angle = (percent / 100) * 2 * Math.PI;
  const endX  = cx + r * Math.sin(angle);
  const endY  = cy - r * Math.cos(angle);
  const large = percent > 50 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`;
}

// ─── Node radius (sqrt scale) ─────────────────────────────────────────────────
const MIN_R   = 3.5;
const MAX_R   = 13;
const MAX_REF = 5_000_000;

function nodeRadius(value) {
  if (!value || value <= 0) return MIN_R;
  return MIN_R + (MAX_R - MIN_R) * Math.min(1, Math.sqrt(value) / Math.sqrt(MAX_REF));
}

// ─── Specimen config ──────────────────────────────────────────────────────────
const SPECIMENS = [
  {
    id: 'cash',
    label: 'Cash & Savings',
    shortName: 'CASH',
    specimenId: 'SP-001',
    placeholder: '500000',
    hint: 'Bank savings, time deposits, GCash',
    cx: 25, cy: 30,
    agarLight:   'rgba(219,234,254,0.65)',
    agarMid:     'rgba(96,165,250,0.30)',
    colonyColor: 'rgba(37,99,235,0.75)',
    rimColor:    '#60a5fa',
    dishText:    '#1e40af',
    inputAccent: '#3b82f6',
    nodeStroke: 'rgba(96,165,250,0.80)', nodeFill: 'rgba(96,165,250,0.18)',
    nodeGlow:   'rgba(96,165,250,0.45)', labelColor: '#93c5fd',
    arcColor: '#60a5fa', animClass: 'node-float-1',
    targetRef: 500_000,
  },
  {
    id: 'emergencyFund',
    label: 'Emergency Fund',
    shortName: 'EMERG',
    specimenId: 'SP-002',
    placeholder: '360000',
    hint: '3–6 months of monthly expenses',
    cx: 72, cy: 28,
    agarLight:   'rgba(254,243,199,0.70)',
    agarMid:     'rgba(251,191,36,0.35)',
    colonyColor: 'rgba(180,83,9,0.75)',
    rimColor:    '#fbbf24',
    dishText:    '#92400e',
    inputAccent: '#f59e0b',
    nodeStroke: 'rgba(251,191,36,0.80)', nodeFill: 'rgba(251,191,36,0.18)',
    nodeGlow:   'rgba(251,191,36,0.45)', labelColor: '#fde68a',
    arcColor: '#fbbf24', animClass: 'node-float-2',
    targetRef: 360_000,
  },
  {
    id: 'healthCoverage',
    label: 'Health Coverage',
    shortName: 'HEALTH',
    specimenId: 'SP-003',
    placeholder: '3000000',
    hint: 'Insurance cash value + HMO benefit amount',
    cx: 70, cy: 68,
    agarLight:   'rgba(209,250,229,0.65)',
    agarMid:     'rgba(52,211,153,0.30)',
    colonyColor: 'rgba(5,150,105,0.75)',
    rimColor:    '#34d399',
    dishText:    '#065f46',
    inputAccent: '#10b981',
    nodeStroke: 'rgba(52,211,153,0.80)', nodeFill: 'rgba(52,211,153,0.18)',
    nodeGlow:   'rgba(52,211,153,0.45)', labelColor: '#6ee7b7',
    arcColor: '#34d399', animClass: 'node-float-3',
    targetRef: 3_000_000,
  },
  {
    id: 'retirementInvestments',
    label: 'Retirement Fund',
    shortName: 'RETIRE',
    specimenId: 'SP-004',
    placeholder: '5000000',
    hint: 'VUL, mutual funds, stocks, PAG-IBIG MP2',
    cx: 28, cy: 72,
    agarLight:   'rgba(237,233,254,0.65)',
    agarMid:     'rgba(167,139,250,0.30)',
    colonyColor: 'rgba(109,40,217,0.75)',
    rimColor:    '#a78bfa',
    dishText:    '#4c1d95',
    inputAccent: '#8b5cf6',
    nodeStroke: 'rgba(167,139,250,0.80)', nodeFill: 'rgba(167,139,250,0.18)',
    nodeGlow:   'rgba(167,139,250,0.45)', labelColor: '#c4b5fd',
    arcColor: '#a78bfa', animClass: 'node-float-4',
    targetRef: 5_000_000,
  },
];

const EDGES = [
  ['cash', 'emergencyFund'],
  ['emergencyFund', 'healthCoverage'],
  ['healthCoverage', 'retirementInvestments'],
  ['retirementInvestments', 'cash'],
  ['cash', 'healthCoverage'],
];

// Hoisted static SVG — reticle grid lines for the microscope view
const RETICLE_GRID = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
  <React.Fragment key={v}>
    <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(52,211,153,0.055)" strokeWidth="0.3" />
    <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(52,211,153,0.055)" strokeWidth="0.3" />
  </React.Fragment>
));

// Fixed agar texture dots — pre-computed to avoid re-render flicker
const DISH_TEXTURE = [
  { cx: 36, cy: 38, r: 1.2 },
  { cx: 64, cy: 34, r: 0.8 },
  { cx: 68, cy: 63, r: 1.0 },
  { cx: 34, cy: 65, r: 0.7 },
  { cx: 55, cy: 74, r: 0.9 },
  { cx: 72, cy: 50, r: 0.6 },
  { cx: 27, cy: 51, r: 1.1 },
  { cx: 50, cy: 29, r: 0.7 },
  { cx: 42, cy: 75, r: 0.5 },
];

// ─── Diagnostic engine ────────────────────────────────────────────────────────
function getDiagnostic(specimenData) {
  const { emergencyFund, healthCoverage, retirementInvestments } = specimenData;
  const total = SPECIMENS.reduce((s, sp) => s + (specimenData[sp.id] || 0), 0);

  if (total === 0) {
    return {
      status: 'AWAITING SPECIMEN',
      statusColor: 'text-slate-400',
      Icon: Clock,
      iconColor: 'text-slate-400',
      summary: 'Submit specimen values to initiate financial culture analysis.',
      observations: [],
      survivalDays: 0,
    };
  }

  const observations = [];

  // "Ilang Araw" — emergency fund in days of family survival (₱60K/mo = ₱2K/day)
  const dailyExpense = 2000;
  const survivalDays = emergencyFund > 0 ? Math.floor(emergencyFund / dailyExpense) : 0;

  if (emergencyFund >= 360_000) {
    observations.push({ ok: true,  text: `Emergency culture covers ≥ 6 months of expenses (${survivalDays} days).` });
  } else if (emergencyFund >= 180_000) {
    observations.push({ ok: null,  text: `Emergency culture ~3 months (${survivalDays} days). Grow to ₱360K+.` });
  } else if (emergencyFund > 0) {
    observations.push({ ok: false, text: `Emergency culture = ${survivalDays} days only. Below 3-month target.` });
  } else {
    observations.push({ ok: false, text: 'No emergency specimen. 0 days of survival. High exposure.' });
  }

  if (healthCoverage >= 1_000_000) {
    observations.push({ ok: true,  text: 'Health culture strong — ₱1M+ coverage confirmed.' });
  } else if (healthCoverage > 0) {
    observations.push({ ok: false, text: 'Health culture below ₱1M. Critical illness risk.' });
  } else {
    observations.push({ ok: false, text: 'Health specimen absent. Major medical exposure.' });
  }

  if (retirementInvestments >= 1_000_000) {
    observations.push({ ok: true,  text: 'Retirement culture growing well. Maintain regimen.' });
  } else if (retirementInvestments > 0) {
    observations.push({ ok: false, text: 'Retirement culture below ₱1M. Accelerate growth.' });
  } else {
    observations.push({ ok: false, text: 'Retirement absent. SSS/GSIS insufficient alone.' });
  }

  const good = observations.filter((o) => o.ok === true).length;

  if (good === 3) return {
    status: 'CULTURE THRIVING',    statusColor: 'text-emerald-600',
    Icon: CheckCircle2,            iconColor:   'text-emerald-500',
    summary: 'All culture strains are healthy. Financial immune system fully active.',
    observations, survivalDays,
  };
  if (good === 2) return {
    status: 'CULTURE STABLE',      statusColor: 'text-blue-600',
    Icon: CheckCircle2,            iconColor:   'text-blue-500',
    summary: 'Good growth with minor gaps. Target flagged specimens.',
    observations, survivalDays,
  };
  if (good === 1) return {
    status: 'CULTURE AT RISK',     statusColor: 'text-amber-600',
    Icon: AlertCircle,             iconColor:   'text-amber-500',
    summary: 'Significant gaps detected. Family exposed to financial shocks.',
    observations, survivalDays,
  };
  return {
    status: 'CULTURE CRITICAL',    statusColor: 'text-red-600',
    Icon: AlertTriangle,           iconColor:   'text-red-500',
    summary: 'Multiple deficiencies. Immediate intervention required.',
    observations, survivalDays,
  };
}

// ─── MicroDish (60px mobile thumbnail) ───────────────────────────────────────
function MicroDish({ spec, value }) {
  const pct      = Math.min(100, (value / spec.targetRef) * 100);
  const depleted = value <= 0;
  const colonyR  = depleted ? 3 : 3 + 11 * Math.min(1, Math.sqrt(value) / Math.sqrt(spec.targetRef));
  const pulseScale = pct >= 70 ? 1.04 : pct >= 30 ? 1.03 : 1.015;

  return (
    <motion.div
      className="w-[60px] h-[60px] shrink-0"
      style={{ willChange: 'transform' }}
      animate={{ scale: [1, pulseScale, 1] }}
      transition={{ duration: pct >= 70 ? 4 : pct >= 30 ? 5 : 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46"
          fill="rgba(255,255,255,0.82)"
          stroke={depleted ? '#e2e8f0' : '#cbd5e1'}
          strokeWidth="2.5" />
        <circle cx="50" cy="50" r="42"
          fill={depleted ? 'rgba(248,250,252,0.9)' : spec.agarLight} />
        {!depleted && pct > 0 && (
          <path d={sectorPath(50, 50, 42, pct)} fill={spec.agarMid} />
        )}
        <circle cx="50" cy="50" r={colonyR}
          fill={depleted ? 'rgba(203,213,225,0.4)' : spec.colonyColor} />
        {!depleted && pct > 0 && (
          <path d={arcPath(50, 50, 45, pct)}
            fill="none" stroke={spec.rimColor} strokeWidth="2" strokeLinecap="round" />
        )}
        <ellipse cx="30" cy="26" rx="8" ry="5"
          fill="white" opacity="0.60" transform="rotate(-28 30 26)" />
      </svg>
    </motion.div>
  );
}

// ─── Mobile Specimen Card ─────────────────────────────────────────────────────
function MobileSpecimenCard({ spec, value, clientView, onChange }) {
  const pct      = Math.min(100, (value / spec.targetRef) * 100);
  const depleted = value <= 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <MicroDish spec={spec} value={value} />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono font-bold tracking-widest uppercase leading-tight"
            style={{ color: depleted ? '#94a3b8' : spec.inputAccent }}>
            {spec.specimenId} · {spec.shortName}
          </p>
          <p className="text-2xl font-black tracking-tight leading-none mt-0.5"
            style={{ color: depleted ? '#94a3b8' : spec.dishText }}>
            {depleted ? '— —' : formatPHP(value)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">{spec.label}</p>
          <div className="mt-1.5 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: spec.rimColor }} />
          </div>
          <p className="text-[9px] font-mono mt-0.5"
            style={{ color: depleted ? '#94a3b8' : spec.rimColor }}>
            {depleted ? 'NO DATA' : `${pct.toFixed(0)}% funded`}
          </p>
        </div>
      </div>
      {!clientView && (
        <div className="bg-stone-50 border-t border-stone-100 px-4 py-2.5">
          <NumericInput
            value={value}
            onChange={onChange}
            placeholder={spec.placeholder}
            className="w-full text-right bg-transparent text-sm font-mono text-stone-700 placeholder:text-stone-300 focus:outline-none"
          />
          <p className="text-[9px] text-stone-400 mt-1">{spec.hint}</p>
        </div>
      )}
    </div>
  );
}

// ─── Petri Dish Widget ────────────────────────────────────────────────────────
function PetriDishWidget({ spec, value, onChange, clientView }) {
  const pct      = Math.min(100, (value / spec.targetRef) * 100);
  const depleted = value <= 0;
  const colonyR  = depleted ? 3 : 3 + 11 * Math.min(1, Math.sqrt(value) / Math.sqrt(spec.targetRef));

  // Pulse animation params based on % funded
  const pulseDuration = pct >= 70 ? 4 : pct >= 30 ? 5 : 6;
  const pulseScale    = pct >= 70 ? 1.04 : pct >= 30 ? 1.02 : 1.008;
  const glowColor     = depleted ? 'rgba(0,0,0,0.06)' : `${spec.rimColor}55`;

  return (
    <div className="rounded-2xl p-2 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-sm border border-white/40 shadow-lg">
      <div className="flex flex-col items-center gap-2 min-w-0">

        {/* ── Petri dish SVG ─────────────────────────────────────── */}
        <motion.div
          className="relative w-full"
          style={{ willChange: 'transform' }}
          animate={{
            scale: [1, pulseScale, 1],
            filter: [
              `drop-shadow(0 4px 8px rgba(0,0,0,0.10))`,
              `drop-shadow(0 6px 12px rgba(0,0,0,0.14)) drop-shadow(0 0 8px ${glowColor})`,
              `drop-shadow(0 4px 8px rgba(0,0,0,0.10))`,
            ],
          }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">

            {/* Outer glass body */}
            <circle cx="50" cy="50" r="46"
              fill="rgba(255,255,255,0.82)"
              stroke={depleted ? '#e2e8f0' : '#cbd5e1'}
              strokeWidth="2.5"
            />

            {/* Agar medium base */}
            {!depleted && (
              <circle cx="50" cy="50" r="42" fill={spec.agarLight} />
            )}
            {depleted && (
              <circle cx="50" cy="50" r="42" fill="rgba(248,250,252,0.9)" />
            )}

            {/* Agar sector fill — funded % */}
            {!depleted && pct > 0 && (
              <path d={sectorPath(50, 50, 42, pct)} fill={spec.agarMid} />
            )}

            {/* Agar texture dots */}
            {!depleted && DISH_TEXTURE.map((dot, i) => (
              <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r}
                fill={spec.agarMid} opacity="0.45"
              />
            ))}

            {/* Colony body */}
            <circle cx="50" cy="50" r={colonyR}
              fill={depleted ? 'rgba(203,213,225,0.4)' : spec.colonyColor}
            />
            {/* Colony inner highlight */}
            {!depleted && (
              <circle cx={50 - colonyR * 0.28} cy={50 - colonyR * 0.28} r={colonyR * 0.35}
                fill="rgba(255,255,255,0.35)"
              />
            )}

            {/* Progress arc track */}
            <circle cx="50" cy="50" r="45"
              fill="none"
              stroke={depleted ? 'rgba(203,213,225,0.3)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.5"
            />
            {/* Progress arc fill */}
            {!depleted && pct > 0 && (
              <path d={arcPath(50, 50, 45, pct)}
                fill="none" stroke={spec.rimColor} strokeWidth="2" strokeLinecap="round"
              />
            )}

            {/* Glass rim inner shadow ring */}
            <circle cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />

            {/* Specular highlights — simulate glass curvature */}
            <ellipse cx="30" cy="26" rx="8" ry="5"
              fill="white" opacity="0.60"
              transform="rotate(-28 30 26)"
            />
            <ellipse cx="37" cy="22" rx="3.5" ry="2"
              fill="white" opacity="0.40"
              transform="rotate(-28 37 22)"
            />

            {/* Light refraction near bottom rim */}
            <ellipse cx="50" cy="80" rx="14" ry="4.5"
              fill="white" opacity="0.28"
            />

            {/* Value text */}
            <text x="50" y="46"
              textAnchor="middle"
              fill={depleted ? '#94a3b8' : spec.dishText}
              fontSize="10" fontFamily="monospace" fontWeight="bold"
            >
              {depleted ? '— —' : formatShort(value)}
            </text>

            {/* Percent label */}
            <text x="50" y="58.5"
              textAnchor="middle"
              fill={depleted ? '#94a3b8' : spec.rimColor}
              fontSize="6.5" fontFamily="monospace" opacity="0.85"
            >
              {depleted ? 'NO DATA' : `${pct.toFixed(0)}% FUNDED`}
            </text>
          </svg>

          {/* 100% funded checkmark badge */}
          {pct >= 100 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </motion.div>

        {/* ── Specimen label ─────────────────────────────────────── */}
        <div className="text-center w-full">
          <p className="text-[9px] font-mono font-bold tracking-widest uppercase leading-tight"
            style={{ color: depleted ? '#94a3b8' : spec.inputAccent }}
          >
            {spec.specimenId} · {spec.shortName}
          </p>
          <p className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5 truncate px-1">
            {spec.label}
          </p>
        </div>

        {/* ── Input (edit mode) or read-only display (client view) ── */}
        {clientView ? (
          <div className="w-full px-1 py-1 text-center">
            <p className="text-sm font-mono font-bold"
              style={{ color: depleted ? '#94a3b8' : spec.inputAccent }}
            >
              {depleted ? '—' : formatPHP(value)}
            </p>
          </div>
        ) : (
          <div className="w-full px-1">
            <NumericInput
              value={value}
              onChange={onChange}
              placeholder={spec.placeholder}
              className="w-full text-center bg-slate-50 border rounded-lg text-xs font-mono text-slate-700 placeholder:text-slate-300 px-2 py-1.5 focus:outline-none transition-all"
              style={{ borderColor: depleted ? '#e2e8f0' : `${spec.inputAccent}35` }}
              onFocus={(e) => { e.target.style.borderColor = spec.inputAccent; e.target.style.backgroundColor = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = depleted ? '#e2e8f0' : `${spec.inputAccent}35`; e.target.style.backgroundColor = ''; }}
            />
            <p className="text-[9px] text-slate-400 text-center mt-1 leading-tight px-1">{spec.hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PetriDishPortfolio({ specimenData, setSpecimenData, onSave, dbStatus, clientView }) {
  const portfolioTotal = SPECIMENS.reduce((s, sp) => s + (specimenData[sp.id] || 0), 0);
  const diagnostic     = useMemo(() => getDiagnostic(specimenData), [specimenData]);
  const { Icon }       = diagnostic;
  const specimenMap    = Object.fromEntries(SPECIMENS.map((sp) => [sp.id, sp]));

  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
  const reportId = `PML-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="h-full w-full p-4 md:p-8 font-sans flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center overflow-x-hidden min-w-0">

      {/* ── Print header — hidden on screen, visible when printing ── */}
      <div className="hidden print:block w-full mb-6 text-center border-b-2 border-stone-300 pb-4">
        <h1 className="text-2xl font-black text-stone-900">PamilyaSecure Financial Lab Results</h1>
        <p className="text-sm text-stone-600 mt-1">
          Kris Jenelyn De Las Peñas · Microbiologist · Pru Life UK Financial Advisor
        </p>
        <p className="text-xs text-stone-400 mt-1 font-mono">
          Report Date: {today} | Lab ID: {reportId} | fiynkdtswagwbgukkjjb.supabase.co
        </p>
      </div>

      {/* ── Left Panel: Specimen Intake ───────────────────────────────── */}
      <div className="w-full md:w-[380px] shrink-0 space-y-4">

        {/* Lab intake card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">

          {/* Lab header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest leading-tight">
                  Financial Culture Analysis · Lab ID: PRU-2026
                </p>
                <h2 className="text-sm font-bold text-white leading-snug">Specimen Intake</h2>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400 tracking-wider">LIVE</span>
              </div>
            </div>
          </div>

          {/* Analyst strip */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-1.5 flex justify-between items-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Analyst: K. De Las Peñas · Microbiologist
            </span>
            <span className="text-[9px] font-mono text-slate-400">{today}</span>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden p-4 space-y-3">
            {SPECIMENS.map(spec => (
              <MobileSpecimenCard key={spec.id} spec={spec}
                value={specimenData[spec.id] || 0} clientView={clientView}
                onChange={(e) =>
                  setSpecimenData((prev) => ({
                    ...prev,
                    [spec.id]: Math.max(0, Number(e.target.value) || 0),
                  }))
                } />
            ))}
          </div>

          {/* Desktop: 2×2 grid */}
          <div className="hidden md:block p-5">
            <div className="grid grid-cols-2 gap-5">
              {SPECIMENS.map((spec) => (
                <PetriDishWidget
                  key={spec.id}
                  spec={spec}
                  value={specimenData[spec.id] || 0}
                  clientView={clientView}
                  onChange={(e) =>
                    setSpecimenData((prev) => ({
                      ...prev,
                      [spec.id]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {/* Total footer + Save + Print */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 space-y-2">
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Total Specimen Value</p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">All cultures combined</p>
              </div>
              <span className="text-xl font-black text-amber-500 shrink-0">{formatPHP(portfolioTotal)}</span>
            </div>
            {!clientView && (
              <div className="no-print flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download Lab Results
                </button>
                <button
                  onClick={onSave}
                  disabled={dbStatus === 'saving' || dbStatus === 'loading'}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    dbStatus === 'saved'
                      ? 'bg-emerald-500 text-white'
                      : dbStatus === 'error'
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {dbStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {dbStatus === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
                  {dbStatus === 'error'  && <CloudOff className="w-3 h-3" />}
                  {dbStatus !== 'saving' && dbStatus !== 'saved' && dbStatus !== 'error' && (
                    <Save className="w-3 h-3" />
                  )}
                  {dbStatus === 'saving' ? 'Saving…' :
                   dbStatus === 'saved'  ? 'Saved'   :
                   dbStatus === 'error'  ? 'Error'   : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic report card */}
        <motion.div
          key={diagnostic.status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
        >
          {/* Report header */}
          <div className="bg-slate-900 px-5 py-3 flex items-center gap-2">
            <Icon className={`w-4 h-4 shrink-0 ${diagnostic.iconColor}`} />
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
              Lab Report · Culture Diagnostic
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Status */}
            <div>
              <p className={`text-xl font-black font-mono tracking-wide ${diagnostic.statusColor}`}>
                {diagnostic.status}
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{diagnostic.summary}</p>
            </div>

            {/* Ilang Araw — Emergency Survival Counter */}
            {diagnostic.survivalDays > 0 && (
              <div className={`rounded-xl p-3.5 border flex items-center gap-3 ${
                diagnostic.survivalDays >= 180 ? 'bg-emerald-50 border-emerald-200' :
                diagnostic.survivalDays >= 90  ? 'bg-amber-50 border-amber-200' :
                                                  'bg-red-50 border-red-200'
              }`}>
                <Clock className={`w-5 h-5 shrink-0 ${
                  diagnostic.survivalDays >= 180 ? 'text-emerald-500' :
                  diagnostic.survivalDays >= 90  ? 'text-amber-500' :
                                                    'text-red-500'
                }`} />
                <div>
                  <p className={`text-lg font-black font-mono ${
                    diagnostic.survivalDays >= 180 ? 'text-emerald-700' :
                    diagnostic.survivalDays >= 90  ? 'text-amber-700' :
                                                      'text-red-700'
                  }`}>
                    {diagnostic.survivalDays} araw
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Emergency fund survival · based on ₱60K/month expenses
                  </p>
                </div>
              </div>
            )}

            {/* Culture observations */}
            {diagnostic.observations.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2.5">
                  Culture Observations
                </p>
                {diagnostic.observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      obs.ok === true  ? 'bg-emerald-500' :
                      obs.ok === false ? 'bg-red-500'     : 'bg-amber-500'
                    }`} />
                    <p className="text-[11px] text-slate-600 leading-snug">{obs.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Analyst signature */}
            <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-mono text-slate-400 uppercase">Certified by</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">Kris Jenelyn De Las Peñas</p>
                <p className="text-[9px] text-slate-400">
                  Microbiologist · Pru Life UK Advisor
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-slate-400">REPORT ID</p>
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">{reportId}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Microscope View ──────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Scope header */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-lg p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest mb-0.5">
              Portfolio Molecular Map · Live Observation
            </p>
            <p className="text-xs text-slate-400 leading-snug">
              Colony size = relative value · Arc ring = % toward target · Gray = awaiting specimen
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Dna className="w-4 h-4 text-emerald-400/50" />
            <Microscope className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        {/* Microscope objective window */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-3 aspect-square max-w-[520px] w-full mx-auto relative overflow-hidden">

          {/* Vignette — microscope lens effect */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none z-10"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)',
            }}
          />

          {/* Scan line animation */}
          <div className="scan-line absolute left-0 right-0 h-px z-20 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.35), transparent)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Microscope reticle grid */}
            {RETICLE_GRID}

            {/* Center crosshair */}
            <line x1="47" y1="50" x2="53" y2="50" stroke="rgba(52,211,153,0.30)" strokeWidth="0.5" />
            <line x1="50" y1="47" x2="50" y2="53" stroke="rgba(52,211,153,0.30)" strokeWidth="0.5" />

            {/* Outer reticle circle */}
            <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(52,211,153,0.04)" strokeWidth="0.3" />

            {/* Edges — molecular bonds */}
            {EDGES.map(([fId, tId]) => {
              const f = specimenMap[fId];
              const t = specimenMap[tId];
              const fActive = (specimenData[fId] || 0) > 0;
              const tActive = (specimenData[tId] || 0) > 0;
              const bothOn  = fActive && tActive;
              return (
                <line
                  key={`${fId}-${tId}`}
                  x1={f.cx} y1={f.cy} x2={t.cx} y2={t.cy}
                  stroke={bothOn ? 'rgba(52,211,153,0.22)' : 'rgba(148,163,184,0.10)'}
                  strokeWidth={bothOn ? '0.5' : '0.3'}
                  strokeDasharray={bothOn ? '2 1.5' : '1.5 2.5'}
                />
              );
            })}

            {/* Nodes */}
            {SPECIMENS.map((spec) => {
              const value    = specimenData[spec.id] || 0;
              const depleted = value <= 0;
              const r        = nodeRadius(value);
              const arcR     = r + 2.5;
              const pct      = Math.min(100, (value / spec.targetRef) * 100);

              return (
                <g
                  key={spec.id}
                  className={spec.animClass}
                  style={{ opacity: depleted ? 0.35 : 1, transition: 'opacity 0.4s ease' }}
                >
                  {/* Glow corona for active nodes */}
                  {!depleted && (
                    <circle
                      cx={spec.cx} cy={spec.cy} r={r + 5}
                      fill={spec.nodeFill.replace('0.18', '0.05')}
                    />
                  )}

                  {/* Progress ring track */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={arcR}
                    fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1"
                  />
                  {/* Progress ring fill */}
                  {pct > 0 && (
                    <path
                      d={arcPath(spec.cx, spec.cy, arcR, pct)}
                      fill="none"
                      stroke={depleted ? 'rgba(100,116,139,0.2)' : spec.arcColor}
                      strokeWidth="1" strokeLinecap="round"
                    />
                  )}

                  {/* Node halo */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={r + 0.9}
                    fill={depleted ? 'rgba(100,116,139,0.04)' : spec.nodeFill.replace('0.18', '0.07')}
                    stroke={depleted ? 'rgba(100,116,139,0.12)' : spec.nodeStroke.replace('0.80', '0.18')}
                    strokeWidth="0.4"
                  />

                  {/* Node body */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={r}
                    fill={depleted ? 'rgba(100,116,139,0.06)' : spec.nodeFill}
                    stroke={depleted ? 'rgba(100,116,139,0.30)' : spec.nodeStroke}
                    strokeWidth="0.6"
                  />

                  {/* Specular highlight */}
                  {!depleted && (
                    <circle
                      cx={spec.cx - r * 0.26} cy={spec.cy - r * 0.30}
                      r={r * 0.30}
                      fill={spec.nodeGlow.replace('0.45', '0.45')}
                    />
                  )}

                  {/* Value label */}
                  <text
                    x={spec.cx} y={spec.cy - 0.5}
                    textAnchor="middle"
                    fill={depleted ? '#64748b' : spec.labelColor}
                    fontSize="2.6" fontFamily="monospace" fontWeight="bold" opacity="0.95"
                  >
                    {depleted ? '—' : formatShort(value)}
                  </text>

                  {/* Short name */}
                  <text
                    x={spec.cx} y={spec.cy + r + 5}
                    textAnchor="middle"
                    fill={depleted ? '#475569' : spec.labelColor}
                    fontSize="2.4" fontFamily="monospace" letterSpacing="0.3" opacity="0.70"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {spec.shortName}
                  </text>

                  {/* % / AWAITING */}
                  <text
                    x={spec.cx} y={spec.cy + r + 8.5}
                    textAnchor="middle"
                    fill={depleted ? '#334155' : spec.labelColor}
                    fontSize="2.1" fontFamily="monospace" opacity="0.45"
                  >
                    {depleted ? 'AWAITING' : `${pct.toFixed(0)}%`}
                  </text>

                  {/* 100% checkmark */}
                  {pct >= 100 && (
                    <text
                      x={spec.cx + r * 0.72} y={spec.cy - r * 0.72}
                      fontSize="3.5" textAnchor="middle" fill="#4ade80"
                    >
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

    </div>
  );
}
