import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_docs/v1';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const DOCS_KEY = Deno.env.get('GOOGLE_DOCS_API_KEY')!;

const headers = () => ({
  Authorization: `Bearer ${LOVABLE_API_KEY}`,
  'X-Connection-Api-Key': DOCS_KEY,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { action, title, documentId, text } = await req.json();

    if (action === 'create') {
      const r = await fetch(`${GATEWAY}/documents`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'New School Document' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));

      // Optionally insert initial text
      if (text && data.documentId) {
        await fetch(`${GATEWAY}/documents/${data.documentId}:batchUpdate`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ insertText: { location: { index: 1 }, text } }],
          }),
        });
      }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get') {
      const r = await fetch(`${GATEWAY}/documents/${documentId}`, { headers: headers() });
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
