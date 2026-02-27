// Deno Edge Function — sends email to Kris via Resend on inquiry submission
// Secrets: RESEND_API_KEY, KRIS_EMAIL (set via Supabase dashboard)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, mobile, age, interests, message, immunityData, gapScore } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const KRIS_EMAIL = Deno.env.get('KRIS_EMAIL');

    if (!RESEND_API_KEY || !KRIS_EMAIL) {
      return new Response(
        JSON.stringify({ error: 'Missing secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Immunity Test section ─────────────────────────────────────────────────
    let immunityHtml = '';
    if (immunityData) {
      const scoreColor = immunityData.score >= 75 ? '#065f46' : immunityData.score >= 45 ? '#92400e' : '#991b1b';
      const scoreBg = immunityData.score >= 75 ? '#ecfdf5' : immunityData.score >= 45 ? '#fffbeb' : '#fef2f2';

      const answersRows = (immunityData.answers || []).map((ans: { q: string; a: string; pts: number }) => {
        const dotColor = ans.pts >= 15 ? '#10b981' : ans.pts >= 10 ? '#f59e0b' : '#ef4444';
        return `<tr>
          <td style="padding:6px 8px;vertical-align:top">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor}"></span>
          </td>
          <td style="padding:6px 8px;color:#78716c;font-size:11px;font-family:monospace;white-space:nowrap;vertical-align:top">${ans.q}</td>
          <td style="padding:6px 8px;color:#44403c;font-size:13px">${ans.a}</td>
        </tr>`;
      }).join('');

      immunityHtml = `
        <div style="margin-top:24px;padding:16px;border-radius:12px;background:${scoreBg};border:1px solid ${scoreColor}20">
          <p style="margin:0 0 8px;font-size:11px;font-family:monospace;color:#78716c;text-transform:uppercase;letter-spacing:2px">Financial Immunity Test</p>
          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:${scoreColor}">${immunityData.score} / ${immunityData.maxScore}</p>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${scoreColor}">${immunityData.diagnosis}</p>
          <table style="border-collapse:collapse;width:100%">${answersRows}</table>
        </div>
      `;
    }

    // ── Gap Score section ─────────────────────────────────────────────────────
    let gapHtml = '';
    if (gapScore != null) {
      const gapColor = gapScore >= 80 ? '#065f46' : gapScore >= 40 ? '#92400e' : '#991b1b';
      const gapBg = gapScore >= 80 ? '#ecfdf5' : gapScore >= 40 ? '#fffbeb' : '#fef2f2';

      gapHtml = `
        <div style="margin-top:16px;padding:16px;border-radius:12px;background:${gapBg};border:1px solid ${gapColor}20">
          <p style="margin:0 0 8px;font-size:11px;font-family:monospace;color:#78716c;text-transform:uppercase;letter-spacing:2px">Coverage Gap Score</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:${gapColor}">${gapScore}%</p>
          <p style="margin:4px 0 0;font-size:12px;color:#78716c">${
            gapScore >= 80 ? 'Strong protection' : gapScore >= 40 ? 'Room for improvement' : 'Significant gaps'
          }</p>
        </div>
      `;
    }

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#292524">New Inquiry from PamilyaLab</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;color:#78716c">Name</td><td style="padding:8px;font-weight:bold">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Mobile</td><td style="padding:8px">${mobile}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Age</td><td style="padding:8px">${age}</td></tr>
          <tr><td style="padding:8px;color:#78716c">Interests</td><td style="padding:8px">${(interests || []).join(', ')}</td></tr>
          ${message ? `<tr><td style="padding:8px;color:#78716c">Message</td><td style="padding:8px">${message}</td></tr>` : ''}
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
        subject: `New Inquiry: ${firstName} ${lastName}`,
        html,
      }),
    });

    const data = await res.json();

    return new Response(
      JSON.stringify(data),
      { status: res.ok ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
