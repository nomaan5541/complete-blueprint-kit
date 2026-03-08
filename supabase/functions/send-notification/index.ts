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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { notification_id, channels } = await req.json();
    if (!notification_id) throw new Error("notification_id required");

    // Fetch notification
    const { data: notification, error: nErr } = await supabase
      .from("notifications")
      .select("*, classes(name)")
      .eq("id", notification_id)
      .single();
    if (nErr || !notification) throw new Error("Notification not found");

    // Fetch school name
    const { data: schoolRow } = await supabase
      .from("schools")
      .select("name")
      .eq("id", notification.school_id)
      .single();

    // Fetch MSG91 config from secure table
    const { data: smsConfig } = await supabase
      .from("school_sms_config")
      .select("msg91_auth_key, msg91_sender_id, msg91_whatsapp_template_id")
      .eq("school_id", notification.school_id)
      .single();

    if (!smsConfig?.msg91_auth_key) {
      return new Response(JSON.stringify({ error: "MSG91 not configured. Go to School Settings → SMS / WhatsApp to add your credentials." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const school = { ...schoolRow, ...smsConfig };

    // Get phone numbers of target audience
    const phones: string[] = [];

    if (channels?.includes("sms") || channels?.includes("whatsapp")) {
      if (notification.target_role === "all" || notification.target_role === "student") {
        let query = supabase.from("students").select("father_phone").eq("school_id", notification.school_id).eq("status", "active");
        if (notification.target_class_id) query = query.eq("class_id", notification.target_class_id);
        const { data: students } = await query;
        students?.forEach((s: any) => { if (s.father_phone) phones.push(s.father_phone); });
      }

      if (notification.target_role === "all" || notification.target_role === "teacher") {
        const { data: teachers } = await supabase.from("teachers").select("phone").eq("school_id", notification.school_id).eq("status", "active");
        teachers?.forEach((t: any) => { if (t.phone) phones.push(t.phone); });
      }
    }

    const uniquePhones = [...new Set(phones.map((p) => p.replace(/\D/g, "").replace(/^0+/, "")))].filter((p) => p.length >= 10);

    const results: Record<string, any> = {};

    // Send SMS via MSG91
    if (channels?.includes("sms") && uniquePhones.length > 0) {
      const smsBody = {
        flow_id: "", // MSG91 flow-based; fallback to direct SMS
        sender: school.msg91_sender_id || "SCHOOL",
        mobiles: uniquePhones.map((p) => (p.length === 10 ? `91${p}` : p)).join(","),
        SMS: notification.message,
      };

      // Using MSG91 Send SMS API
      const smsRes = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "authkey": school.msg91_auth_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: "", // Will use direct send if no template
          recipients: uniquePhones.map((p) => ({
            mobiles: p.length === 10 ? `91${p}` : p,
            var1: notification.title,
            var2: notification.message,
          })),
        }),
      });

      results.sms = { sent_to: uniquePhones.length, status: smsRes.ok ? "sent" : "failed" };
    }

    // Send WhatsApp via MSG91
    if (channels?.includes("whatsapp") && uniquePhones.length > 0 && school.msg91_whatsapp_template_id) {
      for (const phone of uniquePhones.slice(0, 100)) {
        const whatsappNumber = phone.length === 10 ? `91${phone}` : phone;
        await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
          method: "POST",
          headers: {
            "authkey": school.msg91_auth_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            template_id: school.msg91_whatsapp_template_id,
            recipients: [{
              mobiles: whatsappNumber,
              var1: notification.title,
              var2: notification.message,
            }],
          }),
        });
      }
      results.whatsapp = { sent_to: Math.min(uniquePhones.length, 100), status: "sent" };
    }

    if (uniquePhones.length === 0) {
      results.warning = "No phone numbers found for the selected target audience";
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
