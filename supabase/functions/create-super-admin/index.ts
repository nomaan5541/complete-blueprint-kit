import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create super admin user
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: "nomaankhangta@gmail.com",
    password: "C7A188NAA",
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  // Assign super_admin role
  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
    user_id: user.user.id,
    role: "super_admin",
  });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  // Create profile
  await supabaseAdmin.from("profiles").upsert({
    user_id: user.user.id,
    full_name: "Super Admin",
  });

  return new Response(JSON.stringify({ success: true, user_id: user.user.id }), { status: 200 });
});
