import React from 'react';
import { motion } from 'framer-motion';
import {
  Beaker, CheckCircle2, AlertCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { formatPHP, formatShort } from './utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    placeholder: '500000',
    hint: 'Bank savings, time deposits, GCash',
    cx: 25, cy: 30,
    nodeStroke: 'rgba(96,165,250,0.75)', nodeFill: 'rgba(96,165,250,0.14)',
    nodeGlow:   'rgba(96,165,250,0.40)', labelColor: '#3b82f6',
    arcColor: '#60a5fa', animClass: 'node-float-1',
    targetRef: 500_000,
  },
  {
    id: 'emergencyFund',
    label: 'Emergency Fund',
    shortName: 'EMERG',
    placeholder: '360000',
    hint: '3–6 months of monthly expenses',
    cx: 72, cy: 28,
    nodeStroke: 'rgba(251,191,36,0.75)', nodeFill: 'rgba(251,191,36,0.14)',
    nodeGlow:   'rgba(251,191,36,0.40)', labelColor: '#d97706',
    arcColor: '#fbbf24', animClass: 'node-float-2',
    targetRef: 360_000,
  },
  {
    id: 'healthCoverage',
    label: 'Health Coverage',
    shortName: 'HEALTH',
    placeholder: '3000000',
    hint: 'Insurance cash value + HMO benefit amount',
    cx: 70, cy: 68,
    nodeStroke: 'rgba(52,211,153,0.75)', nodeFill: 'rgba(52,211,153,0.14)',
    nodeGlow:   'rgba(52,211,153,0.40)', labelColor: '#059669',
    arcColor: '#34d399', animClass: 'node-float-3',
    targetRef: 3_000_000,
  },
  {
    id: 'retirementInvestments',
    label: 'Retirement Fund',
    shortName: 'RETIRE',
    placeholder: '5000000',
    hint: 'VUL, mutual funds, stocks, PAG-IBIG MP2',
    cx: 28, cy: 72,
    nodeStroke: 'rgba(167,139,250,0.75)', nodeFill: 'rgba(167,139,250,0.14)',
    nodeGlow:   'rgba(167,139,250,0.40)', labelColor: '#7c3aed',
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

// ─── Diagnostic engine ────────────────────────────────────────────────────────
function getDiagnostic(specimenData) {
  const { emergencyFund, healthCoverage, retirementInvestments } = specimenData;
  const total = SPECIMENS.reduce((s, sp) => s + (specimenData[sp.id] || 0), 0);

  if (total === 0) {
    return {
      status: 'AWAITING DATA',
      statusColor: 'text-zinc-500',
      Icon: Clock,
      iconColor: 'text-zinc-500',
      summary: 'Enter your financial data to generate your personalized diagnostic.',
      observations: [],
    };
  }

  const observations = [];

  if (emergencyFund >= 360_000) {
    observations.push({ ok: true,  text: 'Emergency fund covers ≥ 6 months of expenses.' });
  } else if (emergencyFund >= 180_000) {
    observations.push({ ok: null,  text: 'Emergency fund covers ~3 months. Build to ₱360K+.' });
  } else if (emergencyFund > 0) {
    observations.push({ ok: false, text: 'Emergency fund below 3-month target. Prioritize building it.' });
  } else {
    observations.push({ ok: false, text: 'No emergency fund recorded. High financial exposure.' });
  }

  if (healthCoverage >= 1_000_000) {
    observations.push({ ok: true,  text: 'Health coverage is strong (₱1M+ insurance value).' });
  } else if (healthCoverage > 0) {
    observations.push({ ok: false, text: 'Health coverage below ₱1M. Critical illness risk remains.' });
  } else {
    observations.push({ ok: false, text: 'No health coverage recorded. Major medical exposure.' });
  }

  if (retirementInvestments >= 1_000_000) {
    observations.push({ ok: true,  text: 'Retirement portfolio is growing. Stay consistent.' });
  } else if (retirementInvestments > 0) {
    observations.push({ ok: false, text: 'Retirement savings below ₱1M. Accelerate contributions.' });
  } else {
    observations.push({ ok: false, text: 'No retirement investments. SSS/GSIS alone is insufficient.' });
  }

  const goodCount = observations.filter((o) => o.ok === true).length;

  if (goodCount === 3) return {
    status: 'THRIVING',   statusColor: 'text-emerald-400', Icon: CheckCircle2, iconColor: 'text-emerald-400',
    summary: 'Your financial immune system is strong. All major protection layers are active.',
    observations,
  };
  if (goodCount === 2) return {
    status: 'STABLE',     statusColor: 'text-blue-400',    Icon: CheckCircle2, iconColor: 'text-blue-400',
    summary: 'Good foundation with minor gaps. Address the flagged areas to strengthen your position.',
    observations,
  };
  if (goodCount === 1) return {
    status: 'AT RISK',    statusColor: 'text-amber-400',   Icon: AlertCircle,  iconColor: 'text-amber-400',
    summary: 'Significant gaps detected. Your family is exposed to financial shocks.',
    observations,
  };
  return {
    status: 'CRITICAL',   statusColor: 'text-red-400',     Icon: AlertTriangle, iconColor: 'text-red-400',
    summary: 'Multiple critical gaps. Prioritize building your protection coverage immediately.',
    observations,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PetriDishPortfolio({ specimenData, setSpecimenData }) {
  const portfolioTotal = SPECIMENS.reduce((s, sp) => s + (specimenData[sp.id] || 0), 0);
  const diagnostic     = getDiagnostic(specimenData);
  const { Icon }       = diagnostic;

  const specimenMap = Object.fromEntries(SPECIMENS.map((sp) => [sp.id, sp]));

  return (
    <div className="h-full w-full p-4 md:p-8 font-sans flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center overflow-x-hidden min-w-0">

      {/* ── Left Panel: Specimen Intake ───────────────────────────────── */}
      <div className="w-full md:w-[340px] shrink-0 space-y-4">

        {/* Intake form */}
        <div className="bg-zinc-950 rounded-2xl border border-amber-500/20 shadow-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Beaker className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Specimen Intake</h2>
              <p className="text-xs text-zinc-400">Kris &amp; Pamilya · Real numbers only</p>
            </div>
          </div>

          <div className="space-y-4">
            {SPECIMENS.map((spec) => (
              <div key={spec.id} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-medium text-zinc-300">{spec.label}</label>
                  {specimenData[spec.id] > 0 && (
                    <span className="text-xs font-mono font-bold" style={{ color: spec.labelColor }}>
                      {formatShort(specimenData[spec.id])}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={specimenData[spec.id] || ''}
                  onChange={(e) =>
                    setSpecimenData((prev) => ({
                      ...prev,
                      [spec.id]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  placeholder={spec.placeholder}
                  className="w-full bg-zinc-900/80 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <p className="text-[10px] text-zinc-600">{spec.hint}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Total Portfolio</span>
              <span className="text-xl font-black text-amber-400">{formatPHP(portfolioTotal)}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic summary */}
        <motion.div
          key={diagnostic.status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-950 rounded-2xl border border-amber-500/20 shadow-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${diagnostic.iconColor}`} />
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Lab Diagnostic
            </span>
          </div>

          <div>
            <p className={`text-2xl font-black ${diagnostic.statusColor}`}>{diagnostic.status}</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{diagnostic.summary}</p>
          </div>

          {diagnostic.observations.length > 0 && (
            <div className="space-y-2 pt-1">
              {diagnostic.observations.map((obs, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    obs.ok === true  ? 'bg-emerald-400' :
                    obs.ok === false ? 'bg-red-400'     : 'bg-amber-400'
                  }`} />
                  <p className="text-[11px] text-zinc-400 leading-snug">{obs.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-[10px] text-zinc-600 text-right italic">Assessed by</p>
            <p className="text-xs font-semibold text-zinc-300 text-right">Kris Jenelyn De Las Peñas</p>
            <p className="text-[10px] text-zinc-600 text-right">Licensed Pru Life UK Financial Advisor</p>
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Molecular Graph ─────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="bg-stone-50 rounded-2xl border border-stone-200 shadow-sm p-4">
          <p className="text-xs text-stone-400 font-mono uppercase tracking-widest mb-1">
            Portfolio Molecular Map
          </p>
          <p className="text-xs text-stone-500">
            Node size reflects relative value. Ring shows % toward reference target. Gray nodes are awaiting data.
          </p>
        </div>

        <div className="bg-stone-50 rounded-3xl border border-stone-200 shadow-sm p-4 aspect-square max-w-[520px] w-full mx-auto">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid dots */}
            {[20, 40, 60, 80].flatMap((x) =>
              [20, 40, 60, 80].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.4" fill="rgba(0,0,0,0.07)" />
              ))
            )}

            {/* Edges — drawn behind nodes */}
            {EDGES.map(([fId, tId]) => {
              const f = specimenMap[fId];
              const t = specimenMap[tId];
              return (
                <line
                  key={`${fId}-${tId}`}
                  x1={f.cx} y1={f.cy} x2={t.cx} y2={t.cy}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 1.5"
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

              const stroke   = depleted ? 'rgba(120,113,108,0.4)'  : spec.nodeStroke;
              const fill     = depleted ? 'rgba(120,113,108,0.08)' : spec.nodeFill;
              const labelClr = depleted ? '#78716c'                : spec.labelColor;
              const arc      = depleted ? 'rgba(120,113,108,0.3)'  : spec.arcColor;
              const haloFill = depleted ? 'rgba(120,113,108,0.04)' : spec.nodeFill.replace('0.14', '0.06');
              const haloStk  = depleted ? 'rgba(120,113,108,0.15)' : spec.nodeStroke.replace('0.75', '0.2');
              const specular = depleted ? null : spec.nodeGlow.replace('0.40', '0.5');

              return (
                <g
                  key={spec.id}
                  className={spec.animClass}
                  style={{ opacity: depleted ? 0.45 : 1, transition: 'opacity 0.4s ease' }}
                >
                  {/* Progress ring track */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={arcR}
                    fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1"
                  />
                  {/* Progress ring fill */}
                  {pct > 0 && (
                    <path
                      d={arcPath(spec.cx, spec.cy, arcR, pct)}
                      fill="none" stroke={arc} strokeWidth="1" strokeLinecap="round"
                    />
                  )}
                  {/* Halo */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={r + 0.8}
                    fill={haloFill} stroke={haloStk} strokeWidth="0.4"
                  />
                  {/* Node body */}
                  <circle
                    cx={spec.cx} cy={spec.cy} r={r}
                    fill={fill} stroke={stroke} strokeWidth="0.55"
                  />
                  {/* Specular highlight */}
                  {specular && (
                    <circle
                      cx={spec.cx - r * 0.25} cy={spec.cy - r * 0.25} r={r * 0.28}
                      fill={specular}
                    />
                  )}
                  {/* Value label */}
                  <text
                    x={spec.cx} y={spec.cy - 0.5}
                    textAnchor="middle" fill={labelClr}
                    fontSize="2.6" fontFamily="monospace" fontWeight="bold" opacity="0.9"
                  >
                    {depleted ? '—' : formatShort(value)}
                  </text>
                  {/* Name */}
                  <text
                    x={spec.cx} y={spec.cy + r + 5}
                    textAnchor="middle" fill={labelClr}
                    fontSize="2.5" fontFamily="monospace" letterSpacing="0.3" opacity="0.65"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {spec.shortName}
                  </text>
                  {/* % or AWAITING */}
                  <text
                    x={spec.cx} y={spec.cy + r + 8.5}
                    textAnchor="middle" fill={labelClr}
                    fontSize="2.2" fontFamily="monospace" opacity="0.45"
                  >
                    {depleted ? 'AWAITING' : `${pct.toFixed(0)}%`}
                  </text>
                  {/* Checkmark for 100% funded */}
                  {pct >= 100 && (
                    <text
                      x={spec.cx + r * 0.65} y={spec.cy - r * 0.65}
                      fontSize="3.5" textAnchor="middle"
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
