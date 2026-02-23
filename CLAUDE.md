# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

## Architecture

**PamilyaSecurePH** is a Philippine financial planning tool — a single-page React 19 + Vite app with no routing. Navigation is purely tab-based state (`activeTab` in `App.jsx`).

### Component Structure

- `App.jsx` — Shell: sticky nav, tab switcher, footer. Renders one of three feature components based on `activeTab`.
- `FinancialImmunityTest.jsx` — Multi-step scored quiz assessing a Filipino family's financial protection health.
- `ExpirationCalculator.jsx` — PHP-denominated calculator projecting fund depletion given inflation and growth rates. All math runs client-side.
- `PetriDishPortfolio.jsx` — Visual "petri dish" portfolio dashboard. Currently uses hardcoded mock data; intended to pull from Supabase.

## Design System

- **Aesthetic:** OLED Black / Linear.app style — use `bg-zinc-950` or `bg-black` as base.
- **Palette:** Bioluminescent teal/cyan/green with heavy opacity and glow effects.
- **Surfaces:** Glassmorphism — `backdrop-blur-xl`, `bg-black/40`, `border-white/10`.
- **Texture:** Apply a mathematical SVG noise overlay on root containers.

## Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. Framer Motion handles tab transitions and micro-animations.

## Planned Backend (Supabase)

- All browser-facing env vars must use the `VITE_` prefix.
- Every new table requires explicit RLS policies — never bypass Row Level Security.
- Use Supabase-generated types as the source of truth; avoid `any` for DB responses.

## Workflow

- Review `tasks/lessons.md` before starting any new feature.
- Write an execution plan to `tasks/todo.md` with `[ ]` items and get sign-off before implementing.
- Mark items `[x]` as confirmed, and update `tasks/lessons.md` immediately if a core assumption is wrong.
