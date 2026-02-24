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
    const { firstName, lastName, mobile, age, interests, message } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const KRIS_EMAIL = Deno.env.get('KRIS_EMAIL');

    if (!RESEND_API_KEY || !KRIS_EMAIL) {
      return new Response(
        JSON.stringify({ error: 'Missing secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
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
