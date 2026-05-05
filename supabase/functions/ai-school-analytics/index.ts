import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    
    if (!roles?.some((r: any) => r.role === "super_admin")) {
      throw new Error("Forbidden: super_admin only");
    }

    // Fetch all school data in parallel
    const [
      schoolsRes,
      studentsRes,
      teachersRes,
      documentsRes,
      attendanceRes,
      examsRes,
      feePaymentsRes,
      subscriptionsRes,
      homeworkRes,
      meetingsRes,
    ] = await Promise.all([
      supabaseAdmin.from("schools").select("id, name, status, city, state, created_at"),
      supabaseAdmin.from("students").select("id, school_id, status, class_id, created_at"),
      supabaseAdmin.from("teachers").select("id, school_id, created_at"),
      supabaseAdmin.from("student_documents").select("id, school_id, document_type, created_at"),
      supabaseAdmin.from("attendance").select("id, school_id, status, date").limit(5000),
      supabaseAdmin.from("exams").select("id, school_id, exam_mode, status"),
      supabaseAdmin.from("fee_payments").select("id, school_id, amount"),
      supabaseAdmin.from("subscriptions").select("school_id, plan_id, is_active, end_date, subscription_plans(name, price)"),
      supabaseAdmin.from("homework").select("id, school_id"),
      supabaseAdmin.from("meetings").select("id, school_id"),
    ]);

    const schools = schoolsRes.data || [];
    const students = studentsRes.data || [];
    const teachers = teachersRes.data || [];
    const documents = documentsRes.data || [];
    const attendance = attendanceRes.data || [];
    const exams = examsRes.data || [];
    const feePayments = feePaymentsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const homework = homeworkRes.data || [];
    const meetings = meetingsRes.data || [];

    // Build per-school analytics
    const schoolAnalytics = schools.map((school: any) => {
      const schoolStudents = students.filter((s: any) => s.school_id === school.id);
      const schoolTeachers = teachers.filter((t: any) => t.school_id === school.id);
      const schoolDocs = documents.filter((d: any) => d.school_id === school.id);
      const schoolAttendance = attendance.filter((a: any) => a.school_id === school.id);
      const schoolExams = exams.filter((e: any) => e.school_id === school.id);
      const schoolFees = feePayments.filter((f: any) => f.school_id === school.id);
      const schoolSub = subscriptions.find((s: any) => s.school_id === school.id && s.is_active);
      const schoolHomework = homework.filter((h: any) => h.school_id === school.id);
      const schoolMeetings = meetings.filter((m: any) => m.school_id === school.id);

      const activeStudents = schoolStudents.filter((s: any) => s.status === "active").length;
      const totalFeeCollected = schoolFees.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
      const presentCount = schoolAttendance.filter((a: any) => a.status === "present").length;
      const attendanceRate = schoolAttendance.length > 0
        ? Math.round((presentCount / schoolAttendance.length) * 100)
        : 0;

      return {
        school_id: school.id,
        school_name: school.name,
        city: school.city,
        state: school.state,
        status: school.status,
        created_at: school.created_at,
        total_students: schoolStudents.length,
        active_students: activeStudents,
        total_teachers: schoolTeachers.length,
        total_documents: schoolDocs.length,
        document_types: [...new Set(schoolDocs.map((d: any) => d.document_type))],
        total_exams: schoolExams.length,
        online_exams: schoolExams.filter((e: any) => e.exam_mode === "online").length,
        total_fee_collected: totalFeeCollected,
        attendance_records: schoolAttendance.length,
        attendance_rate: attendanceRate,
        total_homework: schoolHomework.length,
        total_meetings: schoolMeetings.length,
        subscription: schoolSub ? {
          plan_name: (schoolSub as any).subscription_plans?.name || "Unknown",
          is_active: schoolSub.is_active,
          end_date: schoolSub.end_date,
        } : null,
      };
    });

    // Platform-wide summary
    const platformSummary = {
      total_schools: schools.length,
      active_schools: schools.filter((s: any) => s.status === "active").length,
      total_students: students.length,
      active_students: students.filter((s: any) => s.status === "active").length,
      total_teachers: teachers.length,
      total_documents: documents.length,
      total_exams: exams.length,
      total_fee_collected: feePayments.reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0),
      total_attendance_records: attendance.length,
      total_homework: homework.length,
      total_meetings: meetings.length,
      schools_with_subscriptions: subscriptions.filter((s: any) => s.is_active).length,
    };

    // Call AI for insights
    const aiPrompt = `You are an educational analytics AI. Analyze this school management platform data and provide actionable insights.

PLATFORM SUMMARY:
${JSON.stringify(platformSummary, null, 2)}

PER-SCHOOL DATA (top schools by student count):
${JSON.stringify(
  schoolAnalytics
    .sort((a: any, b: any) => b.total_students - a.total_students)
    .slice(0, 10),
  null, 2
)}

Provide a JSON response with this exact structure:
{
  "overall_health_score": <number 0-100>,
  "health_label": "<Excellent/Good/Needs Attention/Critical>",
  "key_insights": ["<insight1>", "<insight2>", "<insight3>", "<insight4>"],
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
  "alerts": ["<alert if any critical issues>"],
  "school_rankings": [{"name": "<school>", "score": <0-100>, "reason": "<why>"}],
  "growth_opportunities": ["<opportunity1>", "<opportunity2>"]
}

Be specific with numbers. Focus on engagement, adoption, and growth metrics.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights = null;

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: aiPrompt }],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiInsights = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (aiErr) {
        console.error("AI analysis error:", aiErr);
      }
    }

    return new Response(JSON.stringify({
      platform_summary: platformSummary,
      school_analytics: schoolAnalytics,
      ai_insights: aiInsights,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("ai-school-analytics error:", error);
    const isAuth = error?.message === "Unauthorized" || error?.message?.includes("Forbidden");
    return new Response(JSON.stringify({ error: isAuth ? error.message : "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuth ? 403 : 500,
    });
  }
});
