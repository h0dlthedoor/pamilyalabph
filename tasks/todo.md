# Current Objective
Execute the next major iteration of the AI Financial Lab UI: fix the Petri Dish “white background” bug, localize core tools for the Philippine context (questions + currency + assumptions), and apply premium UI polish to build trust.

## Implementation Plan
- [x] Implement top-level diagnostic shell with tabbed navigation between tools (`src/App.jsx`).
- [x] Build the Financial Immunity Test flow with animated progress and diagnosis card (`src/FinancialImmunityTest.jsx`).
- [x] Build the Shelf Life / Expiration Calculator with dual sliders and depletion visualization (`src/ExpirationCalculator.jsx`).

### Next Major Iteration (Do not implement until approved)

#### 1) Fix Petri Dish UI Bug (white background → transparent/dark blend)
- [x] Audit `src/PetriDishPortfolio.jsx` for light-theme classes and inline styles causing white/washed surfaces (confirmed offenders: `bg-slate-50`, `bg-white`, `bg-white/40`, `from-white/*` overlays, and high-opacity white radial gradients).
- [x] Decide target look: **transparent glass dish** on dark lab background vs **dark glass dish** with subtle highlights (keep consistent with `bg-slate-950` shell).
- [x] Replace light container background (`min-h-screen bg-slate-50`) with shell-friendly layout (no nested page background; use `h-full` / `min-h-full` and dark/transparent surfaces).
- [x] Update “Microscope View” panel surface to match existing premium cards (dark glass: `bg-slate-900/60`, borders `border-slate-700`, text `text-slate-200/400`).
- [x] Update dish base and reflections to avoid white fill while keeping glassmorphism (reduce/retint overlays, adjust blend modes, and ensure reflections don’t read as a white disk).
- [x] Verify hover/tap affordances remain visible on dark backgrounds (culture bubbles, icons, progress bars, empty state).

#### 2) Localize “Immunity Test” for the Philippines
- [x] Rewrite `questions[]` in `src/FinancialImmunityTest.jsx` to reflect PH financial realities (language + options + scoring), explicitly covering:
  - [x] **Healthcare coverage reality**: PhilHealth-only vs HMO vs HMO + critical illness plan; include “out-of-pocket risk” framing.
  - [x] **Government benefits**: SSS vs GSIS membership/coverage as a retirement/benefit baseline (avoid overpromising; phrasing should be general).
  - [x] **Emergency fund in PHP**: months-of-expenses framing in ₱, with realistic brackets.
  - [x] **Sandwich generation**: supporting parents/extended family; include regular remittances/allowance obligations.
- [x] Adjust diagnosis thresholds (score bands) to keep outcomes fair after question changes; ensure each question contributes meaningfully and no single item dominates unfairly.
- [x] Copy/UX pass: keep the lab metaphor but add plain-language clarity (so users understand what their answer implies).
- [x] Accessibility pass: ensure questions/options are readable on small screens and tap targets remain comfortable.

#### 3) Localize “Expiration Calculator” (PHP currency + PH economic assumptions)
- [x] Define what “currency inputs” are required for this tool (e.g., starting capital, monthly expenses/withdrawal, inflation rate, portfolio growth rate, and target age) and which outputs we’ll show (projected depletion age and year).
- [x] Introduce PHP formatting rules for all monetary inputs/outputs (₱ with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`) and decide integer rounding behavior.
- [x] Set PH-relevant default assumptions (inflation rate, expense growth, or other model inputs) with a source-of-truth step:
  - [x] Use a 5% annual inflation default for PH and surface it clearly as an assumption (not advice).
  - [x] Use a realistic middle-class default monthly expense of ₱60,000 and ensure the user can override it.
- [x] Ensure inputs validate safely (no NaNs, negative values, extreme ranges) and calculations remain stable.
- [x] Update microcopy so “Shelf Life” meaning is clear and not fear-driven; keep trust-forward tone while explaining what “money runs out” means.

#### 4) Premium UI Polish (trust-building cohesion)
- [x] Remove cross-tool visual inconsistencies (backgrounds, card surfaces, borders, shadow language, spacing scale).
- [x] Standardize tool container sizing so each tab feels like part of one product (avoid nested `min-h-screen` inside tabs; unify padding).
- [x] Mobile-first pass: nav tabs, content overflow, and form fields; ensure no clipped animations and no accidental horizontal scroll.
- [x] Content polish: consistent headings, labels, capitalization, and tone; reduce “gimmicky” phrasing where it harms trust.
- [x] Add lightweight trust cues without over-claiming (e.g., “assumptions used”, “privacy note” placeholders) while staying UI-only.
- [x] Trust footer: global microcopy “Calculations and results are for illustrative purposes only. All data is processed locally on your device.”
- [x] Premium CTA on Immunity Test result screen and below Expiration Calculator results; glassmorphism, subtle glow, trust-forward copy (“Book a consultation with PamilyaSecurePH” / “Speak to a licensed consultant…”).

#### 5) UI Sound Design (lab/diagnostic cues) — *Skipped for now*
- [ ] Decide on the minimal sound palette that fits the lab metaphor (e.g., subtle drop/click for quiz option selection, soft chime/heartbeat on result screens).
- [ ] Select a lightweight sound hook library (e.g., `use-sound`) and identify where it will be used (`FinancialImmunityTest`, `ExpirationCalculator`, navigation if needed).
- [ ] Plan file structure for audio assets (format, naming, and bundling strategy) without increasing bundle size excessively.
- [ ] Define UX rules for when sounds play (never on every tiny interaction, respect reduced-motion / sound-off preferences, avoid overlapping sounds).
- [ ] Wire planning notes into component-level tasks so that future implementation is straightforward and consistent.

#### 6) Premium Visual Redesign (Design & UI Overhaul)

**1. Color Palette & Background Overhaul (The "Linear" Aesthetic)**
- [x] Strip out all slate classes globally and replace the primary background with pure black (`bg-black`) or ultra-dark zinc (`bg-zinc-950`).
- [x] Replace standard borders with microscopic, high-contrast borders (e.g., `border-white/5` or `border-white/10`).
- [x] Change the accent colors from basic `emerald` to a **Bioluminescent** palette (using Tailwind’s `teal`, `cyan`, and `green` with heavy opacity modifiers for glowing effects).
- [x] Add a subtle CSS grain/noise overlay to the global background to introduce a premium, physical texture.

**2. Petri Dish / Culture Dashboard Redesign (The "Molecular Graph")**
- [x] Redesign the Culture Dashboard so it reads as a high-end molecular node graph instead of chaotic bubbles.
- [x] Represent each biomarker or financial asset (e.g., Cash, Insurance, Investments) as a distinct, glowing node.
- [x] Connect nodes using faint, thin SVG lines (`stroke-white/10`) to evoke molecular bonds or neural synapses.
- [x] Add very slow, subtle motion to nodes (e.g., `animate-pulse` or a custom float keyframe) so the culture feels alive but highly structured.
- [x] Use clean, minimalist typography labels next to or inside each node (e.g., tiny uppercase text with wide tracking such as `tracking-widest text-[10px]`).

**3. Glassmorphism Polish**
- [x] Ensure all cards (CTAs, Microscope View, configuration panels) use strong backdrop blurring (`backdrop-blur-xl` or `backdrop-blur-2xl`) combined with ultra-dark translucent backgrounds (e.g., `bg-black/40`) instead of solid grays.
- [x] Audit existing card components to remove generic Tailwind slate presets and align them with the new bioluminescent, lab-grade aesthetic.

## Verification
- [x] Code compiles without errors and passes basic linting for touched files
- [x] Verified the Petri Dish background renders correctly on the dark shell (no white disk/panel) across common viewport sizes
- [x] Verified Immunity Test PH-localized questions read naturally and scoring produces sensible outcomes
- [x] Verified Expiration Calculator currency formatting and defaults are in PHP and calculations remain stable
- [x] Confirmed no environment-variable or Supabase usage is introduced in this UI iteration
- [x] Relevant Supabase RLS policies checked (N/A for this UI-only iteration)

## Review & Notes
- **Step 4 (Premium UI Polish) completed:** Global trust footer added in `App.jsx` (“Calculations and results are for illustrative purposes only. All data is processed locally on your device.”). Premium CTA cards added to Immunity Test (diagnosis result) and Expiration Calculator (below shelf-life results) with glassmorphism, emerald glow, and copy bridging lab metaphor to real-world consultation (PamilyaSecurePH / licensed consultant). Nav made responsive (stack on small screens, flex-wrap tabs); all tools use `overflow-x-hidden` and `min-w-0` where needed to prevent horizontal scroll. Padding standardized (p-6 sm:p-8 md:p-12) and headings scaled for mobile (text-xl sm:text-2xl, etc.). Step 5 (UI Sound Design) left in plan but skipped per request.
- PH defaults (Expiration Calculator): 5% inflation, ₱60,000 monthly expense, 6% growth; PHP formatting throughout.
- **Step 6 (Premium Visual Redesign) completed:** Root shell switched to `bg-zinc-950 bg-noise` (SVG grain texture in `index.css`). All slate surfaces replaced with `bg-black/40 backdrop-blur-xl` + `border-white/10` across `App.jsx`, `FinancialImmunityTest.jsx`, and `ExpirationCalculator.jsx`. Accent palette shifted from emerald-only to bioluminescent teal/cyan primary + emerald secondary. Navigation bar, tab pill, and footer unified to `bg-black/60 backdrop-blur-xl`. Petri Dish completely replaced with inline SVG molecular node graph (viewBox 0 0 100 100): edges drawn first as dashed `<line>` elements, nodes as layered `<circle>` groups with glow halos, specular highlight circles, uppercase monospace labels, and funding % badges; CSS `node-float-*` keyframes drive slow independent float animations; hover/click activates `drop-shadow` glow and expands halo ring.
- **Screenshot-driven redesign completed (2026-02-24):** Full light theme applied — `bg-slate-100` root, `bg-white` nav + cards, `border-slate-200` borders, blue-700/blue-900 accent palette, amber-400 CTA buttons (matching Kris's existing brand). App renamed "PamilyaLab" with "Financial Health Lab" tagline. Immunity Test: 5 rewritten questions in Filipino-English covering life insurance, healthcare, emergency fund, retirement, and life stage; answer summary shown on result screen with color-coded dots; "Simulan ang Free Consultation" CTA. Savings Runway Calculator: complete rework — plain-language labels ("Your Age Today", "Monthly Family Expenses"), advanced sliders collapsed behind toggle, right panel leads with big age number + years of runway + gap/on-track callout in clear red/green. Portfolio Dashboard: left panel shows total portfolio summary + mini fund cards with status badges when no fund selected; detailed view on select includes metrics grid + coverage notes + monthly premium; SVG graph adds progress-ring arcs + amount labels (₱1.2M format) + ✓ badge for 100% funded + dot-grid lab paper background; edge lines updated to dark stroke for light backgrounds. App.css reset to remove Vite padding/text-align.
- Follow-ups: AI integration, Supabase data wiring, optional sound design.

#### 7) Live Specimen Data & Cross-Tool Sync

- [x] Lift `specimenData` state (`cash`, `emergencyFund`, `healthCoverage`, `retirementInvestments`) to `App.jsx`.
- [x] Derive `portfolioTotal` in `App.jsx` and pass as prop to `ExpirationCalculator`.
- [x] Pass `specimenData` + `setSpecimenData` as props to `PetriDishPortfolio`.
- [x] Rename app header to "Kris | PamilyaLab" in `App.jsx`.
- [x] Update global footer to "© 2026 Kris Jenelyn De Las Peñas. All Rights Reserved."
- [x] Rewrite `PetriDishPortfolio.jsx`: zinc-950 dark Specimen Intake form (left panel) with 4 number inputs (Cash, Emergency Fund, Health Coverage, Retirement Investments), amber glow borders.
- [x] Reactive SVG nodes: radius scales with value (sqrt formula, MIN_R=3.5, MAX_R=13, MAX_REF=₱5M); depleted nodes (value=0) rendered gray + opacity 0.45 + "AWAITING" label.
- [x] Dynamic Diagnostic Summary card: THRIVING / STABLE / AT RISK / CRITICAL / AWAITING DATA status; signed by "Kris Jenelyn De Las Peñas, Licensed Pru Life UK Financial Advisor".
- [x] `ExpirationCalculator`: accept `portfolioTotal` prop; show "Sync from My Portfolio: ₱X" button below Starting Capital when portfolioTotal > 0.