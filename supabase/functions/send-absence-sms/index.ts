import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { school_id, absent_student_ids, date } = await req.json();
    if (!school_id || !absent_student_ids?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "No absent students" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch school MSG91 config
    const { data: school } = await supabase
      .from("schools")
      .select("msg91_auth_key, msg91_sender_id, name")
      .eq("id", school_id)
      .single();

    if (!school?.msg91_auth_key) {
      return new Response(JSON.stringify({ skipped: true, reason: "MSG91 not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get absent students with parent phone
    const { data: students } = await supabase
      .from("students")
      .select("name, father_phone, father_name")
      .in("id", absent_student_ids)
      .not("father_phone", "is", null);

    if (!students?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "No phone numbers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const student of students) {
      const phone = student.father_phone!.replace(/\D/g, "").replace(/^0+/, "");
      if (phone.length < 10) continue;

      const mobile = phone.length === 10 ? `91${phone}` : phone;
      const message = `Dear ${student.father_name || "Parent"}, your child ${student.name} was marked absent on ${date}. - ${school.name}`;

      await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "authkey": school.msg91_auth_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: school.msg91_sender_id || "SCHOOL",
          route: "4",
          country: "91",
          sms: [{ message, to: [mobile] }],
        }),
      });
      sent++;
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
