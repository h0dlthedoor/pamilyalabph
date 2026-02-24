# Coverage Gap Calculator Redesign — 5-Pillar Financial Needs Analysis

**Date:** 2026-02-24
**Status:** Approved
**File:** `src/GapCalculator.jsx` (full rewrite)

## Context

The current Coverage Gap Calculator uses oversimplified formulas (flat income x years for life, arbitrary health thresholds, basic emergency fund). A 20-year financial advisor review identified major gaps: no DIME method, no inflation, no education or retirement pillar analysis. Kris approved a full 5-pillar redesign with step-by-step wizard UX.

## Design

### Wizard Flow (3 steps + results)

| Step | Title | Inputs |
|------|-------|--------|
| 1. Family Profile | "Ang Pamilya Mo" | monthlyIncome, age, spouseWorking (bool), numberOfChildren, youngestChildAge |
| 2. What You Have | "Anong Meron Ka Na?" | existingLifeCoverage, existingHealthCoverage, emergencyFundSavings, educationSavings, retirementSavings |
| 3. Debts & Goals | "Mga Utang at Pangarap" | outstandingDebts, mortgageBalance, schoolType (state/private/top-tier), retirementAge |

Results page shows all 5 pillars at once after Step 3.

### 5 Pillars & Formulas

#### Pillar 1: Life Insurance (DIME Method)
```
replacementYears = clamp(65 - age, 5, 30)
inflationFactor  = sum of (1.05^i) for i=1..replacementYears
incomeNeed       = annualIncome * inflationFactor  (NOT simple multiplication)
need             = outstandingDebts + incomeNeed + mortgageBalance + educationNeed
gap              = max(0, need - existingLifeCoverage)
```

#### Pillar 2: Health / Critical Illness
```
baseNeed by age:
  < 35:  1,500,000
  35-45: 2,000,000
  45-55: 2,500,000
  55+:   3,000,000
dependentAdd = min(numberOfChildren, 3) * 500,000
need         = baseNeed + dependentAdd
gap          = max(0, need - existingHealthCoverage)
```

#### Pillar 3: Emergency Fund
```
monthlyExpenses = monthlyIncome * 0.7
months          = spouseWorking ? 6 : 9
need            = monthlyExpenses * months
gap             = max(0, need - emergencyFundSavings)
```

#### Pillar 4: Education Fund
```
costPerChild by schoolType:
  state:    400,000
  private:  1,200,000
  top-tier: 2,000,000
yearsUntilCollege = max(0, 18 - youngestChildAge)
inflatedCost      = costPerChild * (1.05 ^ yearsUntilCollege)
need              = inflatedCost * numberOfChildren
gap               = max(0, need - educationSavings)

If numberOfChildren === 0, pillar shows "N/A" greyed out.
```

#### Pillar 5: Retirement
```
annualRetirementNeed = monthlyIncome * 12 * 0.7
sssMonthly           = 12,000 (PH average)
yearsInRetirement    = 85 - retirementAge
annualGap            = annualRetirementNeed - (sssMonthly * 12)
inflationFactor      = sum of (1.05^i) for i=1..yearsInRetirement
need                 = annualGap * inflationFactor
gap                  = max(0, need - retirementSavings)
```

### Results Page

- **Overall Protection Score** — weighted average of 5 pillar percentages, color-coded (green 80%+, amber 40-79%, red <40%)
- **5 gap cards** — same visual style (progress bar, need/have/gap, color coding)
- **Priority ranking** — sorted by lowest % first, labeled "Unahin mo ito"
- **Total gap summary** — "Ang kabuuang kulang: X.XM"
- **CTA** — "I-close ang Gaps" button + testimonial rotation

### What Stays

- Header gradient, card visual design, NumericInput component
- Testimonial rotation, CTA + ContactModal, PamilyaLab design tokens
- Mobile-first responsive, Framer Motion animations

### Constants

```js
const PH_INFLATION = 0.05;
const EXPENSE_RATIO = 0.7;
const RETIREMENT_REPLACEMENT = 0.7;
const SSS_MONTHLY = 12000;
const LIFE_EXPECTANCY = 85;
const RETIREMENT_DEFAULT_AGE = 60;
const EDUCATION_COSTS = { state: 400000, private: 1200000, topTier: 2000000 };
const HEALTH_BASE = { under35: 1500000, '35to45': 2000000, '45to55': 2500000, over55: 3000000 };
```
