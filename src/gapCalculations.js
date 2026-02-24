// src/gapCalculations.js
// 5-Pillar Financial Needs Analysis — Pure calculation engine

export const PH_INFLATION = 0.05;
export const ASSUMED_RETURN = 0.07;
export const EXPENSE_RATIO = 0.7;
export const RETIREMENT_REPLACEMENT = 0.7;
export const SSS_MONTHLY = 12000;
export const LIFE_EXPECTANCY = 85;
export const EDUCATION_COSTS = { state: 400000, private: 1200000, topTier: 2000000 };

// Net real rate: (1 + nominal return) / (1 + inflation) - 1
const NET_REAL_RATE = (1 + ASSUMED_RETURN) / (1 + PH_INFLATION) - 1;

// Present Value annuity factor: (1 - (1 + r)^-n) / r
export function pvRealFactor(years) {
  if (years <= 0) return 0;
  const r = NET_REAL_RATE;
  return (1 - Math.pow(1 + r, -years)) / r;
}

// Clamp helper
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// Pillar 1: Life Insurance (DIME Method)
export function calcLife({ age, monthlyIncome, outstandingDebts, mortgageBalance, educationNeed }) {
  const replacementYears = clamp(65 - age, 5, 30);
  const factor = pvRealFactor(replacementYears);
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
  const factor = pvRealFactor(yearsInRetirement);
  const need = annualGap * factor;
  return { need, annualNeed, yearsInRetirement, annualGap };
}

// Overall protection score
export function calcOverallScore(pillars) {
  const active = pillars.filter(p => p.applicable !== false);
  if (active.length === 0) return 0;
  const totalPct = active.reduce((sum, p) => sum + Math.min(100, p.pct), 0);
  return Math.round(totalPct / active.length);
}
