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

    // Verify caller is authenticated and is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) throw new Error("Unauthorized: " + (authErr?.message || "No user"));

    // Check super_admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleData) throw new Error("Only super admins can create schools");

    const body = await req.json();
    const { email, password, fullName, phone, school } = body;

    if (!email || !password || !school?.name) {
      throw new Error("Email, password, and school name are required");
    }

    // Create admin user with email confirmed
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || "" },
    });
    if (createErr) throw new Error("Failed to create user: " + createErr.message);
    const adminUserId = authData.user.id;

    // Create school
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({ ...school, admin_id: adminUserId })
      .select()
      .single();
    if (schoolError) {
      console.error("School insert failed:", schoolError);
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      throw new Error("Failed to create school. Please verify the inputs and try again.");
    }

    // Assign school_admin role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: adminUserId, role: "school_admin" });

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ school_id: schoolData.id, full_name: fullName || "", phone: phone || null })
      .eq("user_id", adminUserId);

    return new Response(JSON.stringify({ school: schoolData, adminUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("create-school-admin error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
