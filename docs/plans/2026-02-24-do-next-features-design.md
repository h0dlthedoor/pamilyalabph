# Do Next Features — Design Doc
Date: 2026-02-24

## Features
1. Shareable Lab Report — downloadable PNG image card via html2canvas
2. Gap Calculator — new 4th nav tab showing coverage gaps
3. "What If?" Comparison — toggle on Savings Runway for side-by-side scenarios
4. "Mag-share sa Pamilya" — downloadable portfolio snapshot image
5. Optimizations — a11y, prefers-reduced-motion, form attributes, Supabase indexes

## Dependencies
- `html2canvas` npm package (features 1 & 4)

## Files to Create/Modify
- NEW: `src/GapCalculator.jsx` — Coverage Gap tab
- NEW: `src/shareCard.js` — shared html2canvas utility
- MODIFY: `src/FinancialImmunityTest.jsx` — add share card render + download button
- MODIFY: `src/ExpirationCalculator.jsx` — add What If toggle + comparison view
- MODIFY: `src/PetriDishPortfolio.jsx` — add Mag-share button + card render
- MODIFY: `src/App.jsx` — add 4th nav tab, wire GapCalculator
- MODIFY: `src/index.css` — prefers-reduced-motion, focus-visible, overscroll
- MIGRATION: `supabase/migrations/20260224_add_quiz_leads_index.sql`
