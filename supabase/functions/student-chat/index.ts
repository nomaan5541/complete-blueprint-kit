import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();

    // Input validation: message length cap
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Get student data
    const { data: student } = await supabase
      .from("students")
      .select(`
        *, 
        classes(name), 
        sections(name), 
        academic_years(name),
        school_id
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!student) throw new Error("Student not found");

    // Fetch student context data
    const [examsRes, homeworkRes, feesRes, attendanceRes] = await Promise.all([
      supabase.from("exams")
        .select("name, exam_date, exam_type, status, subjects(name)")
        .eq("school_id", student.school_id)
        .eq("class_id", student.class_id)
        .order("exam_date", { ascending: true })
        .limit(10),
      supabase.from("homework")
        .select("title, due_date, status, subjects(name)")
        .eq("school_id", student.school_id)
        .eq("class_id", student.class_id)
        .eq("status", "active")
        .order("due_date", { ascending: true })
        .limit(10),
      supabase.from("fee_structures")
        .select("amount, fee_types(name)")
        .eq("school_id", student.school_id)
        .eq("class_id", student.class_id)
        .eq("academic_year_id", student.academic_year_id),
      supabase.from("attendance")
        .select("date, status")
        .eq("student_id", student.id)
        .order("date", { ascending: false })
        .limit(30),
    ]);

    const feePaymentsRes = await supabase.from("fee_payments")
      .select("amount, fee_types(name)")
      .eq("student_id", student.id);

    // Calculate fee status
    const totalFeeStructure = feesRes.data?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
    const totalPaid = feePaymentsRes.data?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
    const totalDue = totalFeeStructure - totalPaid;

    // Calculate attendance
    const presentDays = attendanceRes.data?.filter(a => a.status === "present").length || 0;
    const totalDays = attendanceRes.data?.length || 0;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";

    // Prepare context
    const contextData = {
      student: {
        name: student.name,
        class: student.classes?.name,
        section: student.sections?.name,
        academic_year: student.academic_years?.name,
      },
      exams: examsRes.data || [],
      homework: homeworkRes.data || [],
      fees: {
        total: totalFeeStructure,
        paid: totalPaid,
        due: totalDue,
        breakdown: feesRes.data || [],
      },
      attendance: {
        present: presentDays,
        total: totalDays,
        percentage: attendanceRate,
      },
    };

    // Get previous messages
    const { data: previousMessages } = await supabase
      .from("student_chat_messages")
      .select("role, content")
      .eq("student_id", student.id)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant for ${student.name}, a student at their school. You have access to their academic information and can answer questions about their exams, homework, fees, and attendance.

STUDENT DATA:
${JSON.stringify(contextData, null, 2)}

Instructions:
- Be friendly, helpful, and concise
- Answer questions based on the student's actual data
- For exam schedules, list upcoming exams with dates
- For homework, list active assignments with due dates
- For fees, provide clear breakdown of paid vs due amounts
- For attendance, provide percentage and days present/total
- If asked about something not in the data, politely say you don't have that information
- Keep responses short and conversational (2-3 sentences max unless listing items)`,
      },
      ...(previousMessages || []).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Save user message
    await supabase.from("student_chat_messages").insert({
      student_id: student.id,
      school_id: student.school_id,
      role: "user",
      content: message,
    });

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim() !== "");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    assistantMessage += content;
                    controller.enqueue(encoder.encode(line + "\n"));
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }

          // Save assistant response
          if (assistantMessage) {
            await supabase.from("student_chat_messages").insert({
              student_id: student.id,
              school_id: student.school_id,
              role: "assistant",
              content: assistantMessage,
            });
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
