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

    // Verify caller
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
      throw new Error("Only school admins can import students");
    }

    const { schoolId, academicYearId, students } = await req.json();

    if (!schoolId || !academicYearId || !students?.length) {
      throw new Error("schoolId, academicYearId, and students array are required");
    }

    // Verify school ownership (bypass for super_admin)
    if (!callerRoles.includes("super_admin")) {
      const { data: ownedSchool } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("id", schoolId)
        .eq("admin_id", caller.id)
        .maybeSingle();
      if (!ownedSchool) throw new Error("Forbidden: you do not own this school");
    }

    // Get classes and sections for this school
    const { data: classes } = await supabaseAdmin
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId);
    const { data: sections } = await supabaseAdmin
      .from("sections")
      .select("id, name, class_id")
      .eq("school_id", schoolId);

    // Build lookup maps
    const classMap = new Map<string, string>();
    for (const c of classes || []) {
      classMap.set(c.name.toLowerCase(), c.id);
    }

    const sectionMap = new Map<string, string>();
    for (const s of sections || []) {
      sectionMap.set(`${s.class_id}_${s.name.toLowerCase()}`, s.id);
    }

    // UDISE class name mapping
    const udiseClassMap: Record<string, string> = {
      "lkg/kg1/pre-school": "lkg",
      "ukg/kg2/pre-primary": "ukg",
      "i": "1",
      "ii": "2",
      "iii": "3",
      "iv": "4",
      "v": "5",
      "vi": "6",
      "vii": "7",
      "viii": "8",
      "ix": "9",
      "x": "10",
    };

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of students) {
      try {
        // Map class name
        const rawClass = (student.className || "").toLowerCase().trim();
        const mappedClass = udiseClassMap[rawClass] || rawClass;
        const classId = classMap.get(mappedClass);
        
        if (!classId) {
          errors.push(`${student.name}: class "${student.className}" not found`);
          failed++;
          continue;
        }

        // Map section
        const sectionName = (student.section || "a").toLowerCase().trim();
        const sectionId = sectionMap.get(`${classId}_${sectionName}`) || null;

        // Parse dates (DD/MM/YYYY → YYYY-MM-DD)
        const parseDateDMY = (d: string): string | null => {
          if (!d) return null;
          const parts = d.split("/");
          if (parts.length !== 3) return null;
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        };

        const admissionNumber = student.admissionNumber || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const name = student.name || "";
        const gender = (student.gender || "").toLowerCase() === "female" ? "female" : 
                       (student.gender || "").toLowerCase() === "male" ? "male" : null;
        const dob = parseDateDMY(student.dob);
        const admissionDate = parseDateDMY(student.admissionDate);

        // Check if master record exists
        const { data: existing } = await supabaseAdmin
          .from("student_master")
          .select("id")
          .eq("school_id", schoolId)
          .eq("admission_number", admissionNumber)
          .maybeSingle();

        let masterId: string;
        if (existing) {
          masterId = existing.id;
        } else {
          const { data: newMaster, error: mErr } = await supabaseAdmin
            .from("student_master")
            .insert({
              school_id: schoolId,
              admission_number: admissionNumber,
              name,
              gender,
              date_of_birth: dob,
              father_name: student.fatherName || null,
              father_phone: student.phone || null,
              mother_name: student.motherName || null,
              address: student.address || null,
              pincode: student.pincode || null,
              admission_date: admissionDate,
              caste_category: student.casteCategory || null,
            })
            .select("id")
            .single();
          if (mErr) {
            errors.push(`${name}: master insert failed - ${mErr.message}`);
            failed++;
            continue;
          }
          masterId = newMaster.id;
        }

        // Check if year record already exists
        const { data: existingYear } = await supabaseAdmin
          .from("students")
          .select("id")
          .eq("school_id", schoolId)
          .eq("admission_number", admissionNumber)
          .eq("academic_year_id", academicYearId)
          .maybeSingle();

        if (existingYear) {
          // Already exists for this year, skip
          success++;
          continue;
        }

        // Create year record
        const { error: sErr } = await supabaseAdmin
          .from("students")
          .insert({
            school_id: schoolId,
            admission_number: admissionNumber,
            name,
            gender,
            date_of_birth: dob,
            father_name: student.fatherName || null,
            father_phone: student.phone || null,
            mother_name: student.motherName || null,
            address: student.address || null,
            pincode: student.pincode || null,
            class_id: classId,
            section_id: sectionId,
            academic_year_id: academicYearId,
            student_master_id: masterId,
            admission_date: admissionDate,
            caste_category: student.casteCategory || null,
          });

        if (sErr) {
          errors.push(`${name}: student insert failed - ${sErr.message}`);
          failed++;
        } else {
          success++;
        }
      } catch (e: any) {
        errors.push(`${student.name || "unknown"}: ${e.message}`);
        failed++;
      }
    }

    return new Response(JSON.stringify({ success, failed, errors: errors.slice(0, 20) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("bulk-import-students error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
