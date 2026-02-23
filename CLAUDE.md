# PamilyaSecurePH - Development Guide

## Project Context
- **Owner:** Kris (Licensed Microbiologist / Financial Consultant)
- **Environment:** WSL2 (Ubuntu) - Native Linux Filesystem
- **Tech Stack:** React (Vite) + Tailwind CSS + Supabase + Lucide-react

## Coding Standards
- **Style:** Functional components with Tailwind CSS (Mobile-first).
- **Icons:** Use `lucide-react` for all iconography.
- **State:** Use React Hooks; prioritize clean, readable logic.
- **Database:** Supabase-js for client-side queries; enforce RLS always.
- **Naming:** PascalCase for Components; camelCase for functions/variables.

## Key Terminal Commands
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Database:** `npx supabase status` / `npx supabase gen types typescript`

## AI Interaction Rules
- **Direct Action:** You have full permission to run terminal commands (npm, git, ls).
- **Conciseness:** Provide code first, explanations only when requested.
- **Git First:** Commit changes frequently with descriptive messages.
- **Performance:** Since we are on native ext4, use Vite HMR for instant feedback.
