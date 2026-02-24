# Do Now Features — Design Doc
Date: 2026-02-24

## Features
1. Lead Capture Form before quiz results (FinancialImmunityTest)
2. "Ilang Araw" Emergency Counter (PetriDishPortfolio diagnostic)
3. Social Proof Testimonials near CTAs
4. Auto-Sync Portfolio total → Savings Runway starting capital

## Implementation Details

### 1. Lead Capture Form
- New intermediate screen after Q5 answer, before results
- Fields: First Name (required) + Mobile Number (required, PH 09XX format)
- Primary CTA: "Ipakita ang Results" (amber pulse)
- Skip link: "Tingnan na lang ang results"
- Supabase table: `quiz_leads` (id, first_name, mobile, score, answers_json, created_at)
- File: `src/FinancialImmunityTest.jsx`

### 2. Ilang Araw Counter
- In diagnostic report observations section
- Formula: days = floor(emergencyFund / 2000) — based on 60K/mo = 2K/day
- Color: green >= 180 days, amber >= 90, red < 90
- File: `src/PetriDishPortfolio.jsx` (getDiagnostic function)

### 3. Social Proof Testimonials
- 3-4 placeholder Filipino testimonials, auto-rotate every 5s
- Placed inside CTA boxes in FinancialImmunityTest results + ExpirationCalculator
- Shared testimonials constant in `src/testimonials.js`
- Files: `src/testimonials.js`, `src/FinancialImmunityTest.jsx`, `src/ExpirationCalculator.jsx`

### 4. Auto-Sync Portfolio → Runway
- useEffect syncs portfolioTotal → startingCapital on mount if portfolioTotal > 0
- manualOverride ref prevents overwriting user edits
- File: `src/ExpirationCalculator.jsx`
