import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_calendar/calendar/v3';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const CAL_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY')!;

const headers = () => ({
  Authorization: `Bearer ${LOVABLE_API_KEY}`,
  'X-Connection-Api-Key': CAL_KEY,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { action, calendarId = 'primary', event, timeMin, timeMax } = await req.json();

    if (action === 'listEvents') {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      });
      const r = await fetch(`${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
        headers: headers(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'createEvent') {
      // event: { summary, description, start: {dateTime}, end: {dateTime}, attendees:[{email}], conferenceData? }
      const url = `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`;
      const body = { ...event };
      if (event?.withMeet) {
        body.conferenceData = {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        };
        delete body.withMeet;
      }
      const r = await fetch(url, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
