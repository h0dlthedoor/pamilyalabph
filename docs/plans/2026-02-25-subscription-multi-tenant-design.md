# PamilyaLab Multi-Tenant Subscription Design

**Date:** 2026-02-25
**Status:** Approved
**Author:** Kris + Claude

## Problem

Kris's Pru Life UK teammates (5-20 advisors in her direct unit) want their own branded version of PamilyaLab's financial tools for lead generation. Currently the app is single-tenant — only Kris's branding and leads.

## Solution

Convert PamilyaLab into a multi-tenant SaaS where each advisor gets a personalized URL (`pamilyalab.com/slug`) with their own branding, contact info, and lead dashboard.

## Business Model

- **Price:** PHP 199/month per advisor
- **Payment:** Manual (GCash/bank transfer to Kris) — no payment gateway needed at this scale
- **Target:** 5-20 Pru Life UK advisors in Kris's direct unit
- **Revenue projection:** PHP 995–2,985/month (PHP 11,940–35,820/year)
- **Cost:** ~PHP 0/month (Supabase + Vercel + Resend free tiers)

## Architecture

### Approach: Multi-Tenant SaaS (Single Codebase)

One deployment, one database, slug-based routing. Each advisor is a "tenant" whose data is isolated via Supabase RLS.

### Data Model

```sql
-- New table: advisor profiles
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  credentials TEXT,
  photo_url TEXT,
  viber_number TEXT,
  fb_messenger_link TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'active', 'expired')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Modify existing tables
ALTER TABLE quiz_leads ADD COLUMN advisor_id UUID REFERENCES advisors(id);
ALTER TABLE client_inquiries ADD COLUMN advisor_id UUID REFERENCES advisors(id);
```

### RLS Policies

- **Anonymous:** INSERT into quiz_leads/client_inquiries (with advisor_id)
- **Authenticated advisor:** SELECT/UPDATE only rows WHERE advisor_id matches their advisor record
- **Super-admin (Kris):** SELECT all rows across all advisors

### URL Routing

```
/              → Kris's default version (backwards compatible)
/:slug         → Advisor's branded version (fetched from advisors table)
/login         → Advisor login page
/super-admin   → Kris's management panel
```

### What Gets Personalized Per Advisor

- Header: Advisor's display_name
- Footer: Advisor's name + credentials
- Contact Modal: Their Viber number + FB Messenger link
- Inquiry form: Email notification goes to that advisor
- Admin Dashboard: Shows only their leads (RLS enforced)

### What Stays Shared

- All calculator logic (Immunity Test, Gap Calculator)
- Design system (colors, fonts, animations)
- Sound effects
- Core UI components

## Advisor Onboarding Flow

1. Kris collects advisor info (name, slug, Viber, FB, photo) via chat/form
2. Kris creates account in super-admin panel (Supabase auth user + advisor record)
3. Advisor receives login credentials via Viber/email
4. Advisor can update their own profile (photo, contact info) from dashboard
5. Kris activates plan after receiving GCash/bank payment

## Super-Admin Panel (Kris Only)

- Advisor management: list, activate/deactivate, view plan status
- Global analytics: total leads across all advisors
- Kris's own advisor dashboard (unchanged)
- Revenue tracking: who's paid, who's expiring

## Explicitly Out of Scope (YAGNI)

- Self-service signup page
- Online payment gateway (Stripe/PayMongo)
- Custom domains or subdomains
- Advisor-to-advisor messaging
- Team analytics or leaderboards
- Email marketing automation
- PDF exports (PNG download stays)

These can be added if the subscriber base grows beyond the direct unit.

## Technical Notes

- **Supabase free tier:** 50K rows, 500MB storage, 50K auth users — more than enough for 20 advisors
- **Vercel free tier:** Handles traffic easily at this scale
- **Resend free tier:** 100 emails/day — sufficient for 20 advisors' inquiries
- **React Router:** Slug detection at top level, advisor context passed down
- **Existing data migration:** Kris's current leads get assigned her advisor_id. Zero data loss.
