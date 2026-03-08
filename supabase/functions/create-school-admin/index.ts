import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleData) throw new Error("Only super admins can create schools");

    const body = await req.json();
    const { email, password, fullName, phone, school } = body;

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError) throw authError;
    const adminUserId = authData.user.id;

    // Upload logo handled client-side, logo_url passed in school object

    // Create school
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({ ...school, admin_id: adminUserId })
      .select()
      .single();
    if (schoolError) {
      // Cleanup: delete created user
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      throw schoolError;
    }

    // Assign school_admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: adminUserId, role: "school_admin" });
    if (roleError) throw roleError;

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ school_id: schoolData.id, full_name: fullName || "", phone: phone || null })
      .eq("user_id", adminUserId);

    return new Response(JSON.stringify({ school: schoolData, adminUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
