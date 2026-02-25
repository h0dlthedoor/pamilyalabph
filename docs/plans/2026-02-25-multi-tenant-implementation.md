# Multi-Tenant PamilyaLab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert PamilyaLab from a single-tenant Kris-only app into a multi-tenant SaaS where each Pru Life UK advisor gets `pamilyalab.com/:slug` with their own branding, contact info, and lead dashboard.

**Architecture:** Single codebase, single deployment. React Router handles slug-based routing. Supabase RLS isolates each advisor's data. An `AdvisorContext` React context provides the current advisor's profile to all components. Kris gets a super-admin panel to manage advisors.

**Tech Stack:** React 19 + Vite 7 + Tailwind CSS 4 + react-router-dom v7 + Supabase (Auth + RLS + Edge Functions) + Framer Motion

---

## Task 1: Install react-router-dom and set up routing shell

**Files:**
- Modify: `package.json` (add react-router-dom)
- Modify: `src/main.jsx` (wrap in BrowserRouter)
- Create: `src/AdvisorContext.jsx` (context for current advisor profile)
- Modify: `src/App.jsx` (add Routes, extract slug from URL)

**Step 1: Install react-router-dom**

Run: `npm install react-router-dom`

**Step 2: Create AdvisorContext**

Create `src/AdvisorContext.jsx`:

```jsx
import { createContext, useContext } from 'react';

const AdvisorContext = createContext(null);

export function AdvisorProvider({ advisor, children }) {
  return (
    <AdvisorContext.Provider value={advisor}>
      {children}
    </AdvisorContext.Provider>
  );
}

export function useAdvisor() {
  return useContext(AdvisorContext);
}
```

**Step 3: Wrap main.jsx in BrowserRouter**

Modify `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 4: Add routing to App.jsx**

Modify `src/App.jsx` to use `Routes` + `Route`:

- Route `/` renders the app with Kris as default advisor (backwards compatible)
- Route `/login` renders a dedicated login page
- Route `/super-admin` renders super-admin panel (Kris only)
- Route `/:slug` fetches advisor by slug from Supabase, renders branded app

The App component fetches the advisor profile based on the slug param, wraps content in `<AdvisorProvider>`.

**Step 5: Verify dev server starts**

Run: `npm run dev`
Expected: App loads at `localhost:5173/` showing Kris's version (unchanged from current behavior)

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add react-router-dom and AdvisorContext for multi-tenant routing"
```

---

## Task 2: Create Supabase migration for `advisors` table

**Files:**
- Create: `supabase/migrations/20260225_create_advisors.sql`

**Step 1: Write the migration SQL**

Create `supabase/migrations/20260225_create_advisors.sql`:

```sql
-- Advisor profiles (multi-tenant)
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  credentials TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  viber_number TEXT DEFAULT '',
  fb_messenger_link TEXT DEFAULT '',
  email TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  is_super_admin BOOLEAN DEFAULT false,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'active', 'expired')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

-- Anyone can read active advisor profiles (needed for slug lookup)
CREATE POLICY "Public can read active advisors"
  ON advisors FOR SELECT
  USING (is_active = true);

-- Advisors can update their own profile
CREATE POLICY "Advisors can update own profile"
  ON advisors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super-admin (Kris) can do everything
CREATE POLICY "Super-admin full access"
  ON advisors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM advisors a
      WHERE a.user_id = auth.uid() AND a.is_super_admin = true
    )
  );

CREATE INDEX idx_advisors_slug ON advisors(slug);
CREATE INDEX idx_advisors_user_id ON advisors(user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260225_create_advisors.sql
git commit -m "feat: add advisors table migration with RLS"
```

**Step 3: Run migration in Supabase Dashboard**

Run the SQL in the Supabase Dashboard SQL Editor manually (as per project convention).

---

## Task 3: Add `advisor_id` to existing tables + update RLS

**Files:**
- Create: `supabase/migrations/20260225_add_advisor_id_to_leads.sql`

**Step 1: Write the migration**

Create `supabase/migrations/20260225_add_advisor_id_to_leads.sql`:

```sql
-- Add advisor_id to quiz_leads
ALTER TABLE quiz_leads ADD COLUMN advisor_id UUID REFERENCES advisors(id);
CREATE INDEX idx_quiz_leads_advisor_id ON quiz_leads(advisor_id);

-- Add advisor_id to client_inquiries
ALTER TABLE client_inquiries ADD COLUMN advisor_id UUID REFERENCES advisors(id);
CREATE INDEX idx_client_inquiries_advisor_id ON client_inquiries(advisor_id);

-- Drop old RLS policies and create advisor-scoped ones

-- quiz_leads: anon insert (must provide advisor_id)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON quiz_leads;
CREATE POLICY "Anon can insert quiz leads"
  ON quiz_leads FOR INSERT TO anon
  WITH CHECK (true);

-- quiz_leads: advisor can read own leads
DROP POLICY IF EXISTS "Authenticated can read leads" ON quiz_leads;
CREATE POLICY "Advisor can read own quiz leads"
  ON quiz_leads FOR SELECT TO authenticated
  USING (
    advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM advisors WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- quiz_leads: advisor can update own leads
CREATE POLICY "Advisor can update own quiz leads"
  ON quiz_leads FOR UPDATE TO authenticated
  USING (
    advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM advisors WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- client_inquiries: keep anon insert
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON client_inquiries;
CREATE POLICY "Anon can insert inquiries"
  ON client_inquiries FOR INSERT
  WITH CHECK (true);

-- client_inquiries: advisor can read own
DROP POLICY IF EXISTS "Auth can read inquiries" ON client_inquiries;
CREATE POLICY "Advisor can read own inquiries"
  ON client_inquiries FOR SELECT TO authenticated
  USING (
    advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM advisors WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- client_inquiries: advisor can update own
DROP POLICY IF EXISTS "Auth can update inquiries" ON client_inquiries;
CREATE POLICY "Advisor can update own inquiries"
  ON client_inquiries FOR UPDATE TO authenticated
  USING (
    advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM advisors WHERE user_id = auth.uid() AND is_super_admin = true)
  );
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260225_add_advisor_id_to_leads.sql
git commit -m "feat: add advisor_id to leads tables, update RLS for multi-tenant"
```

**Step 3: Run migration in Supabase Dashboard**

Run the SQL in the Supabase Dashboard SQL Editor. Then seed Kris's advisor record:

```sql
-- Create Kris's advisor record (get her user_id from auth.users)
INSERT INTO advisors (user_id, slug, display_name, credentials, viber_number, fb_messenger_link, email, is_super_admin, plan)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Kris is the only user
  'kris',
  'Kris Jenelyn De Las Peñas',
  'Microbiologist · Pru Life UK Financial Advisor',
  '+639156373238',
  'https://m.me/kris.pasiona',
  '', -- her email
  true,
  'active'
);

-- Backfill existing leads to Kris
UPDATE quiz_leads SET advisor_id = (SELECT id FROM advisors WHERE slug = 'kris');
UPDATE client_inquiries SET advisor_id = (SELECT id FROM advisors WHERE slug = 'kris');
```

---

## Task 4: Implement slug-based advisor loading in App.jsx

**Files:**
- Modify: `src/App.jsx` (add slug param, fetch advisor, wrap in AdvisorProvider)

**Step 1: Add slug-based routing**

Modify `src/App.jsx`:

- Import `Routes, Route, useParams, Navigate` from react-router-dom
- Create an `AdvisorApp` component that:
  1. Reads `slug` from `useParams()` (defaults to `'kris'` for `/` route)
  2. Fetches advisor profile from `supabase.from('advisors').select('*').eq('slug', slug).single()`
  3. Shows loading state while fetching
  4. Shows 404 if advisor not found or inactive
  5. Wraps the existing app UI in `<AdvisorProvider advisor={advisor}>`
- Set up routes:
  - `<Route path="/" element={<AdvisorApp defaultSlug="kris" />} />`
  - `<Route path="/login" element={<LoginPage />} />`
  - `<Route path="/super-admin" element={<SuperAdminPage />} />` (placeholder for now)
  - `<Route path="/:slug" element={<AdvisorApp />} />`

**Step 2: Verify Kris's version still works**

Run: `npm run dev`
Navigate to `localhost:5173/`
Expected: App loads showing Kris's branding (fetched from advisors table)

Navigate to `localhost:5173/kris`
Expected: Same as above

Navigate to `localhost:5173/nonexistent`
Expected: 404 or redirect

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: implement slug-based advisor loading with AdvisorProvider"
```

---

## Task 5: Personalize components using AdvisorContext

**Files:**
- Modify: `src/App.jsx:162-172` (header: advisor name)
- Modify: `src/App.jsx:250-260` (footer: advisor name + credentials)
- Modify: `src/ContactModal.jsx` (advisor's Viber + FB links)
- Modify: `src/ClientInquiryForm.jsx:107` (advisor name in header text)
- Modify: `src/ClientInquiryForm.jsx:57` (include advisor_id in insert)
- Modify: `src/ClientInquiryForm.jsx:69` (pass advisor email to notify function)

**Step 1: Update App.jsx header**

In the nav logo section, replace hardcoded "Kris | PamilyaLab" with:

```jsx
const advisor = useAdvisor();
// ...
<h1>
  {advisor?.display_name?.split(' ')[0] || 'PamilyaLab'} | PamilyaLab
</h1>
```

**Step 2: Update App.jsx footer**

Replace hardcoded Kris name/credentials:

```jsx
<span className="font-bold text-stone-800">{advisor?.display_name || 'PamilyaLab'}</span>
// ...
<span className="text-stone-400 font-normal">{advisor?.credentials || ''}</span>
```

**Step 3: Update ContactModal**

Modify `src/ContactModal.jsx` to accept advisor from context:

```jsx
import { useAdvisor } from './AdvisorContext';

export default function ContactModal({ isOpen, onClose }) {
  const advisor = useAdvisor();

  const handleViber = () => {
    playChime();
    const num = advisor?.viber_number?.replace(/[^0-9]/g, '') || '639156373238';
    window.location.href = `viber://chat?number=%2B${num}&text=Hi!%20I'd%20like%20to%20book%20a%20free%20consultation.`;
    setTimeout(() => window.open(`https://viber.click/${num}`, '_blank'), 1500);
  };
  // FB link: advisor?.fb_messenger_link || 'https://m.me/kris.pasiona'
  // Display name: advisor?.display_name || 'Kris Jenelyn De Las Peñas'
  // Credentials: advisor?.credentials || 'Microbiologist & Pru Life UK Financial Advisor'
}
```

**Step 4: Update ClientInquiryForm**

Modify `src/ClientInquiryForm.jsx`:

- Import `useAdvisor` and get `advisor` from context
- Add `advisor_id: advisor?.id` to the insert payload
- Pass advisor email to `notify-inquiry` edge function
- Replace "Kris" in header text with `advisor?.display_name?.split(' ')[0]`
- Replace "Kris" in success message with advisor's first name

**Step 5: Verify personalization works**

Run: `npm run dev`
Navigate to `localhost:5173/kris`
Expected: Header shows "Kris | PamilyaLab", footer shows Kris's full name and credentials, Contact modal shows Kris's Viber/FB links

**Step 6: Commit**

```bash
git add src/App.jsx src/ContactModal.jsx src/ClientInquiryForm.jsx
git commit -m "feat: personalize all components using AdvisorContext"
```

---

## Task 6: Update AdminPanel for advisor-scoped leads

**Files:**
- Modify: `src/AdminPanel.jsx` (filter by advisor_id, show advisor's own leads)

**Step 1: Scope queries to current advisor**

Modify `src/AdminPanel.jsx`:

- Import `useAdvisor` from AdvisorContext
- Get advisor record to determine their `id`
- Fetch advisor record from Supabase using `auth.uid()` → `advisors.user_id`
- Queries already scoped by RLS, but show advisor name in header
- Replace "Lead Management" header email with advisor's display name

**Step 2: Verify lead isolation**

Navigate to admin while logged in as Kris.
Expected: Only Kris's leads appear (RLS enforces this).

**Step 3: Commit**

```bash
git add src/AdminPanel.jsx
git commit -m "feat: scope AdminPanel to current advisor's leads via RLS"
```

---

## Task 7: Update notify-inquiry edge function for multi-tenant

**Files:**
- Modify: `supabase/functions/notify-inquiry/index.ts` (accept advisor email, send to advisor instead of hardcoded Kris)

**Step 1: Update edge function**

Modify `supabase/functions/notify-inquiry/index.ts`:

- Accept `advisorEmail` in the request body
- If `advisorEmail` is provided, send notification to that address
- Fall back to `KRIS_EMAIL` env var if no advisor email
- Update subject line: "New Inquiry via PamilyaLab"

```typescript
const { firstName, lastName, mobile, age, interests, message, advisorEmail } = await req.json();
const toEmail = advisorEmail || Deno.env.get('KRIS_EMAIL');
```

**Step 2: Commit**

```bash
git add supabase/functions/notify-inquiry/index.ts
git commit -m "feat: support per-advisor email notifications in edge function"
```

**Step 3: Deploy edge function**

Run: `npx supabase functions deploy notify-inquiry`

---

## Task 8: Build Super-Admin panel for Kris

**Files:**
- Create: `src/SuperAdminPanel.jsx`
- Modify: `src/App.jsx` (add super-admin route)

**Step 1: Create SuperAdminPanel component**

Create `src/SuperAdminPanel.jsx` with:

- **Advisor list:** Table showing all advisors (name, slug, plan, status, created_at)
- **Add advisor:** Form to create new advisor (creates Supabase auth user + advisor record)
  - Fields: display_name, slug, email, viber_number, fb_messenger_link, credentials
  - Generates a temporary password, creates auth user via `supabase.auth.admin.createUser` (requires service role — use edge function instead)
- **Toggle active/inactive:** Button per advisor
- **Plan management:** Dropdown to change plan status (trial/active/expired)
- **Stats:** Total leads per advisor, total subscribers, revenue estimate

Note: For creating auth users, we need a Supabase Edge Function since `auth.admin` requires the service role key (not safe in browser). Create a simple `create-advisor` edge function.

**Step 2: Create `create-advisor` edge function**

Create `supabase/functions/create-advisor/index.ts`:

- Accepts: email, password, display_name, slug, viber_number, fb_messenger_link, credentials
- Verifies caller is super-admin (check JWT → advisors table → is_super_admin)
- Creates auth user via `supabase.auth.admin.createUser`
- Creates advisor record linked to new user
- Returns advisor record

**Step 3: Wire up super-admin route in App.jsx**

Add route: `<Route path="/super-admin" element={<SuperAdminGuard><SuperAdminPanel /></SuperAdminGuard>} />`

`SuperAdminGuard` checks that the logged-in user's advisor record has `is_super_admin = true`.

**Step 4: Verify**

Log in as Kris, navigate to `/super-admin`.
Expected: See advisor management panel with Kris listed.

**Step 5: Commit**

```bash
git add src/SuperAdminPanel.jsx supabase/functions/create-advisor/
git commit -m "feat: add super-admin panel for advisor management"
```

---

## Task 9: Add advisor profile edit page

**Files:**
- Modify: `src/AdminPanel.jsx` (add "Edit Profile" section/tab)

**Step 1: Add profile editing to AdminPanel**

Add a third tab "My Profile" to AdminPanel with:

- Editable fields: display_name, credentials, photo_url, viber_number, fb_messenger_link
- Photo upload via Supabase Storage (optional — can use URL input for MVP)
- Save button that updates `advisors` table
- Preview of how their branded page looks

**Step 2: Verify**

Log in as Kris, go to Admin → My Profile tab.
Expected: Can edit and save profile fields. Changes reflect on the public `/kris` page.

**Step 3: Commit**

```bash
git add src/AdminPanel.jsx
git commit -m "feat: add advisor profile editing to AdminPanel"
```

---

## Task 10: Configure Vite for SPA fallback + Vercel routing

**Files:**
- Create: `vercel.json` (SPA rewrites for client-side routing)
- Modify: `vite.config.js` (if needed for dev server history fallback)

**Step 1: Create vercel.json**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures all routes (e.g., `/juan`, `/super-admin`) serve `index.html` so React Router handles them client-side.

**Step 2: Verify dev server handles routes**

Run: `npm run dev`
Navigate to `localhost:5173/kris` directly (not via link)
Expected: App loads and shows Kris's branded version (Vite dev server already handles SPA fallback)

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel SPA rewrite rules for client-side routing"
```

---

## Task 11: End-to-end smoke test

**Files:** None (manual testing)

**Step 1: Test default route**

Navigate to `localhost:5173/`
Expected: Kris's version loads (backwards compatible)

**Step 2: Test slug route**

Navigate to `localhost:5173/kris`
Expected: Same as above — Kris's branding, Kris's contact info

**Step 3: Test lead capture isolation**

1. Navigate to `localhost:5173/kris`
2. Submit a quiz or inquiry
3. Log in as Kris, check admin dashboard
4. Expected: Lead appears with `advisor_id` matching Kris

**Step 4: Test super-admin**

1. Log in as Kris
2. Navigate to `/super-admin`
3. Expected: See advisor list with Kris

**Step 5: Test 404**

Navigate to `localhost:5173/doesnotexist`
Expected: 404 page or redirect to `/`

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: multi-tenant MVP complete — ready for testing"
```

---

## Implementation Order & Dependencies

```
Task 1 (Router + Context)
    ↓
Task 2 (advisors table) ──→ Task 3 (advisor_id on leads)
    ↓                              ↓
Task 4 (slug loading) ←───────────┘
    ↓
Task 5 (personalize components)
    ↓
Task 6 (admin scoping) ──→ Task 9 (profile editing)
    ↓
Task 7 (edge function)
    ↓
Task 8 (super-admin)
    ↓
Task 10 (Vercel config)
    ↓
Task 11 (smoke test)
```

Tasks 2 & 3 (SQL migrations) can be run in Supabase Dashboard independently from Task 1 (code changes). Tasks 1-4 are the critical path — once those work, the rest builds on top.
