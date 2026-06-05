import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;

const FROM = 'EduprimeX <onboarding@resend.dev>'; // change to verified domain when set

const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  otp: (d) => ({
    subject: `Your EduprimeX verification code`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Verification Code</h2><p>Your code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${d.code}</p><p>Expires in 10 minutes.</p></div>`,
  }),
  feeReminder: (d) => ({
    subject: `Fee reminder — ${d.studentName}`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Fee Payment Reminder</h2><p>Dear Parent of <b>${d.studentName}</b>,</p><p>Outstanding amount: <b>₹${d.amount}</b></p><p>Due date: <b>${d.dueDate}</b></p><p>Please pay through the parent portal.</p><p>— ${d.schoolName}</p></div>`,
  }),
  admission: (d) => ({
    subject: `Admission Confirmation — ${d.studentName}`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Welcome to ${d.schoolName}!</h2><p>${d.studentName} has been successfully admitted to <b>${d.className}</b>.</p><p>Admission No: <b>${d.admissionNo}</b></p></div>`,
  }),
  attendance: (d) => ({
    subject: `Attendance Alert — ${d.studentName}`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Absence Notice</h2><p>${d.studentName} was marked <b>absent</b> on ${d.date}.</p><p>If this is incorrect, please contact the class teacher.</p><p>— ${d.schoolName}</p></div>`,
  }),
  generic: (d) => ({ subject: d.subject || 'Notification', html: d.html || `<p>${d.message || ''}</p>` }),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY || !RESEND_KEY) throw new Error('Resend not configured');

    const { to, template = 'generic', data = {}, from } = await req.json();
    if (!to) throw new Error('Missing "to" email');

    const builder = TEMPLATES[template] || TEMPLATES.generic;
    const { subject, html } = builder(data);

    const r = await fetch(`${GATEWAY}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_KEY,
      },
      body: JSON.stringify({
        from: from || FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(result));

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
