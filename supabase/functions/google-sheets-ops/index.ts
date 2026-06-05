import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_sheets/v4';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SHEETS_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;

const headers = () => ({
  Authorization: `Bearer ${LOVABLE_API_KEY}`,
  'X-Connection-Api-Key': SHEETS_KEY,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { action, title, spreadsheetId, range, values } = await req.json();

    if (action === 'create') {
      const r = await fetch(`${GATEWAY}/spreadsheets`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title: title || 'New School Sheet' } }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'read') {
      const r = await fetch(`${GATEWAY}/spreadsheets/${spreadsheetId}/values/${range || 'Sheet1!A1:Z1000'}`, {
        headers: headers(),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'append') {
      const r = await fetch(
        `${GATEWAY}/spreadsheets/${spreadsheetId}/values/${range || 'Sheet1'}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: values || [] }),
        }
      );
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
