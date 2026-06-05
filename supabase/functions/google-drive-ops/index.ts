import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive/drive/v3';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const DRIVE_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY')!;

function authHeaders() {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': DRIVE_KEY,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !DRIVE_KEY) throw new Error('Google Drive connector not configured');

    const { action, folderId, query, fileName, parentId, mimeType } = await req.json();

    if (action === 'list') {
      const q = folderId
        ? `'${folderId}' in parents and trashed=false`
        : query
        ? `name contains '${String(query).replace(/'/g, "\\'")}' and trashed=false`
        : `trashed=false`;
      const url = `${GATEWAY}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,parents)&pageSize=100&orderBy=folder,modifiedTime%20desc`;
      const r = await fetch(url, { headers: authHeaders() });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'createFolder') {
      if (!fileName) throw new Error('fileName required');
      const body: any = { name: fileName, mimeType: 'application/vnd.google-apps.folder' };
      if (parentId) body.parents = [parentId];
      const r = await fetch(`${GATEWAY}/files?fields=id,name,mimeType,webViewLink`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      const { fileId } = await Promise.resolve({ fileId: (await req.clone().json()).fileId });
      const r = await fetch(`${GATEWAY}/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
      if (!r.ok && r.status !== 204) throw new Error(await r.text());
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
