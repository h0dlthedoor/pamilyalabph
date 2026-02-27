// Deno Edge Function — sends email to Kris via Resend on inquiry submission
// Secrets: RESEND_API_KEY, KRIS_EMAIL (set via Supabase dashboard)
// Security: JWT verification, input validation, HTML escaping, restricted CORS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://pamilyasecureph.vercel.app';

function corsHeaders(origin?: string) {
  const allowed = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// ── HTML escaping to prevent XSS in emails ────────────────────────────────────
function esc(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Input validation ──────────────────────────────────────────────────────────
const VALID_INTERESTS = [
  'Life Insurance',
  'Health Coverage',
  'Emergency Fund',
  'Retirement Planning',
  'Investment/VUL',
];

function validateInput(body: Record<string, unknown>): string | null {
  const { firstName, lastName, mobile, age, interests, message, immunityData, gapScore } = body;

  if (typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 100)
    return 'Invalid firstName';
  if (typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 100)
    return 'Invalid lastName';
  if (typeof mobile !== 'string' || !/^09\d{9}$/.test(mobile))
    return 'Invalid mobile';
  if (typeof age !== 'number' || age < 18 || age > 99 || !Number.isInteger(age))
    return 'Invalid age';
  if (!Array.isArray(interests) || interests.length === 0 || interests.length > 5)
    return 'Invalid interests';
  const validLower = VALID_INTERESTS.map(v => v.toLowerCase());
  for (const i of interests) {
    if (typeof i !== 'string' || !validLower.includes(i.toLowerCase())) return `Invalid interest: ${i}`;
  }
  if (message != null && (typeof message !== 'string' || message.length > 2000))
    return 'Invalid message';
  if (immunityData != null && typeof immunityData !== 'object')
    return 'Invalid immunityData';
  if (gapScore != null && (typeof gapScore !== 'number' || gapScore < 0 || gapScore > 100))
    return 'Invalid gapScore';

  return null;
}

// ── JWT verification ──────────────────────────────────────────────────────────
async function verifyJwtOrAnon(req: Request): Promise<boolean> {
  // We verify the request has a valid Supabase anon/service key via the apikey header
  // and optionally a valid JWT in the Authorization header.
  // The function is called after a successful DB insert, so we verify the apikey
  // matches our project to prevent cross-project abuse.
  const apikey = req.headers.get('apikey') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  // Verify the apikey matches one of our project keys
  if (apikey !== supabaseAnonKey && apikey !== supabaseServiceKey) {
    return false;
  }

  // If an Authorization bearer token is present, verify it via Supabase auth
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    // Skip verification for the anon key itself (used as bearer token by supabase-js)
    if (token === supabaseAnonKey) return true;

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return false;
    } catch {
      return false;
    }
  }

  return true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || undefined;
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // ── Verify request origin ───────────────────────────────────────────────
    const isAuthorized = await verifyJwtOrAnon(req);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Parse and validate input ────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const validationError = validateInput(body);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const { firstName, lastName, mobile, age, interests, message, immunityData, gapScore } = body as {
      firstName: string;
      lastName: string;
      mobile: string;
      age: number;
      interests: string[];
      message: string | null;
      immunityData: { score: number; maxScore: number; diagnosis: string; answers?: { q: string; a: string; pts: number }[] } | null;
      gapScore: number | null;
    };

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const KRIS_EMAIL = Deno.env.get('KRIS_EMAIL');

    if (!RESEND_API_KEY || !KRIS_EMAIL) {
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Build HTML (all user values escaped) ────────────────────────────────

    // Immunity Test section
    let immunityHtml = '';
    if (immunityData) {
      const score = Number(immunityData.score) || 0;
      const maxScore = Number(immunityData.maxScore) || 100;
      const scoreColor = score >= 75 ? '#065f46' : score >= 45 ? '#92400e' : '#991b1b';
      const scoreBg = score >= 75 ? '#ecfdf5' : score >= 45 ? '#fffbeb' : '#fef2f2';

      const answersRows = (immunityData.answers || []).slice(0, 10).map((ans) => {
        const pts = Number(ans.pts) || 0;
        const dotColor = pts >= 15 ? '#10b981' : pts >= 10 ? '#f59e0b' : '#ef4444';
        return `<tr>
          <td style="padding:6px 8px;vertical-align:top">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor}"></span>
          </td>
          <td style="padding:6px 8px;color:#78716c;font-size:11px;font-family:monospace;white-space:nowrap;vertical-align:top">${esc(ans.q)}</td>
          <td style="padding:6px 8px;color:#44403c;font-size:13px">${esc(ans.a)}</td>
        </tr>`;
      }).join('');

      immunityHtml = `
        <div style="margin-top:24px;padding:16px;border-radius:12px;background:${scoreBg};border:1px solid ${scoreColor}20">
          <p style="margin:0 0 8px;font-size:11px;font-family:monospace;color:#78716c;text-transform:uppercase;letter-spacing:2px">Financial Immunity Test</p>
          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:${scoreColor}">${esc(score)} / ${esc(maxScore)}</p>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${scoreColor}">${esc(immunityData.diagnosis)}</p>
          <table style="border-collapse:collapse;width:100%">${answersRows}</table>
        </div>
      `;
    }

    // Gap Score section
    let gapHtml = '';
    if (gapScore != null) {
      const gs = Number(gapScore) || 0;
      const gapColor = gs >= 80 ? '#065f46' : gs >= 40 ? '#92400e' : '#991b1b';
      const gapBg = gs >= 80 ? '#ecfdf5' : gs >= 40 ? '#fffbeb' : '#fef2f2';

      gapHtml = `
        <div style="margin-top:16px;padding:16px;border-radius:12px;background:${gapBg};border:1px solid ${gapColor}20">
          <p style="margin:0 0 8px;font-size:11px;font-family:monospace;color:#78716c;text-transform:uppercase;letter-spacing:2px">Coverage Gap Score</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:${gapColor}">${esc(gs)}%</p>
          <p style="margin:4px 0 0;font-size:12px;color:#78716c">${
            gs >= 80 ? 'Strong protection' : gs >= 40 ? 'Room for improvement' : 'Significant gaps'
          }</p>
        </div>
      `;
    }

    // Sanitize interests list
    const safeInterests = interests.map(i => esc(i)).join(', ');

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#292524">New Inquiry from PamilyaLab</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;color:#78716c">Name</td><td style="padding:8px;font-weight:bold">${esc(firstName)} ${esc(lastName)}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Mobile</td><td style="padding:8px">${esc(mobile)}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Age</td><td style="padding:8px">${esc(age)}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Interests</td><td style="padding:8px">${safeInterests}</td></tr>
          ${message ? `<tr><td style="padding:8px;color:#78716c">Message</td><td style="padding:8px">${esc(message)}</td></tr>` : ''}
        </table>
        ${immunityHtml}
        ${gapHtml}
        <p style="color:#a8a29e;font-size:12px;margin-top:24px">Sent from pamilyasecureph.vercel.app</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PamilyaLab <onboarding@resend.dev>',
        to: [KRIS_EMAIL],
        subject: `New Inquiry: ${esc(firstName)} ${esc(lastName)}`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: res.ok }),
      { status: res.ok ? 200 : 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
