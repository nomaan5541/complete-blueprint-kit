import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) throw new Error("Unauthorized");

    // Verify caller is school_admin or super_admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const callerRoles = (roles || []).map((r: any) => r.role);
    if (!callerRoles.includes("school_admin") && !callerRoles.includes("super_admin")) {
      throw new Error("Only school admins can create user accounts");
    }

    const { email, password, fullName, role, schoolId, teacherId, studentId } = await req.json();

    // Verify school_admin owns the specified school (super_admins bypass)
    if (!callerRoles.includes("super_admin")) {
      const { data: ownedSchool } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("id", schoolId)
        .eq("admin_id", caller.id)
        .maybeSingle();
      if (!ownedSchool) {
        throw new Error("Forbidden: you do not own this school");
      }
    }
    if (!email || !password || !role || !schoolId) {
      throw new Error("email, password, role, and schoolId are required");
    }
    if (!["teacher", "student"].includes(role)) {
      throw new Error("Role must be teacher or student");
    }

    // Create user with email confirmed
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || "" },
    });
    if (createErr) throw new Error("Failed to create user: " + createErr.message);
    const userId = authData.user.id;

    // Assign role
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });

    // Update profile
    await supabaseAdmin.from("profiles")
      .update({ school_id: schoolId, full_name: fullName || "" })
      .eq("user_id", userId);

    // Link to teacher or student record - with school ownership validation
    if (role === "teacher" && teacherId) {
      // Validate teacher belongs to the specified school
      const { data: teacher, error: teacherErr } = await supabaseAdmin
        .from("teachers")
        .select("school_id")
        .eq("id", teacherId)
        .single();
      
      if (teacherErr || !teacher) {
        throw new Error("Teacher not found");
      }
      if (teacher.school_id !== schoolId) {
        throw new Error("Teacher does not belong to this school");
      }
      
      await supabaseAdmin.from("teachers").update({ user_id: userId }).eq("id", teacherId);
    }
    
    if (role === "student" && studentId) {
      // Validate student belongs to the specified school
      const { data: student, error: studentErr } = await supabaseAdmin
        .from("students")
        .select("school_id")
        .eq("id", studentId)
        .single();
      
      if (studentErr || !student) {
        throw new Error("Student not found");
      }
      if (student.school_id !== schoolId) {
        throw new Error("Student does not belong to this school");
      }
      
      await supabaseAdmin.from("students").update({ user_id: userId }).eq("id", studentId);
      await supabaseAdmin.from("student_master").update({ user_id: userId }).eq("id", studentId);
    }

    // No longer storing plaintext passwords - Supabase Auth manages credentials securely

    return new Response(JSON.stringify({ userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("create-user-account error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
