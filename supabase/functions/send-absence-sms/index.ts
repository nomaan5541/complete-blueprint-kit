import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { school_id, absent_student_ids, date } = await req.json();
    if (!school_id || !absent_student_ids?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "No absent students" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a teacher or admin of this school
    const { data: school } = await supabase
      .from("schools")
      .select("admin_id, name")
      .eq("id", school_id)
      .single();

    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = school.admin_id === user.id;
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("school_id", school_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isAdmin && !teacher) {
      return new Response(JSON.stringify({ error: "Forbidden: not a teacher or admin of this school" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch MSG91 config from secure table
    const { data: smsConfig } = await supabase
      .from("school_sms_config")
      .select("msg91_auth_key, msg91_sender_id, msg91_whatsapp_template_id")
      .eq("school_id", school_id)
      .single();

    if (!smsConfig?.msg91_auth_key) {
      return new Response(JSON.stringify({ skipped: true, reason: "MSG91 not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get absent students with parent phone
    const { data: students } = await supabase
      .from("students")
      .select("name, father_phone, father_name")
      .in("id", absent_student_ids)
      .eq("school_id", school_id)
      .not("father_phone", "is", null);

    if (!students?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "No phone numbers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let smsSent = 0;
    let waSent = 0;
    for (const student of students) {
      const phone = student.father_phone!.replace(/\D/g, "").replace(/^0+/, "");
      if (phone.length < 10) continue;

      const mobile = phone.length === 10 ? `91${phone}` : phone;
      const message = `Dear ${student.father_name || "Parent"}, your child ${student.name} was marked absent on ${date}. - ${school.name}`;

      // Send SMS
      try {
        await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: {
            "authkey": smsConfig.msg91_auth_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: smsConfig.msg91_sender_id || "SCHOOL",
            route: "4",
            country: "91",
            sms: [{ message, to: [mobile] }],
          }),
        });
        smsSent++;
      } catch (e) {
        console.error("SMS error:", e);
      }

      // Send WhatsApp if template configured
      if (smsConfig.msg91_whatsapp_template_id) {
        try {
          await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
            method: "POST",
            headers: {
              "authkey": smsConfig.msg91_auth_key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              integrated_number: smsConfig.msg91_sender_id || undefined,
              content_type: "template",
              payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                  name: smsConfig.msg91_whatsapp_template_id,
                  language: { code: "en", policy: "deterministic" },
                  namespace: null,
                  to_and_components: [
                    {
                      to: [mobile],
                      components: {
                        body_1: { type: "text", value: student.father_name || "Parent" },
                        body_2: { type: "text", value: student.name },
                        body_3: { type: "text", value: date },
                      },
                    },
                  ],
                },
              },
            }),
          });
          waSent++;
        } catch (e) {
          console.error("WhatsApp error:", e);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sms_sent: smsSent, whatsapp_sent: waSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-absence-sms error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
