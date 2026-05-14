import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Send, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What are my assignments?",
  "Show my today's timetable",
  "Upcoming exams",
  "Study tips for physics",
  "Remind me about PTM",
];

export default function StudentAIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoadingHistory(true);
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (!student) { setLoadingHistory(false); return; }
      const { data } = await supabase.from("student_chat_messages").select("role, content").eq("student_id", student.id).order("created_at", { ascending: true });
      setMessages((data || []).map((m: any) => ({ role: m.role, content: m.content })));
      setLoadingHistory(false);
    })();
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const userMessage = (text ?? input).trim();
    if (!userMessage || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ message: userMessage }),
      });
      if (!response.ok) {
        if (response.status === 429) toast.error("Too many requests. Wait a moment.");
        else if (response.status === 402) toast.error("AI service unavailable.");
        else toast.error("Failed to get response");
        setMessages((p) => p.slice(0, -1)); setLoading(false); return;
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistant = ""; let buf = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim(); if (j === "[DONE]") break;
          try {
            const c = JSON.parse(j).choices?.[0]?.delta?.content;
            if (c) { assistant += c; setMessages((p) => { const n = [...p]; n[n.length - 1] = { role: "assistant", content: assistant }; return n; }); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) { console.error(e); toast.error("Failed to send"); setMessages((p) => p.slice(0, -1)); }
    setLoading(false);
  }

  if (loadingHistory) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin student-muted-text" /></div>;

  return (
    <div className="space-y-4 pb-6 pt-2 flex flex-col min-h-[calc(100vh-220px)] animate-fade-in">
      {messages.length === 0 ? (
        <div className="text-center py-6">
          <div className="h-24 w-24 mx-auto rounded-3xl bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] flex items-center justify-center shadow-[0_18px_38px_hsl(var(--student-primary)/0.45)]">
            <Bot className="h-12 w-12 text-[hsl(var(--student-foreground))]" />
          </div>
          <p className="font-extrabold text-2xl mt-4">Hello! 👋</p>
          <p className="text-sm student-muted-text mt-1">How can I help you today?</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] text-[hsl(var(--student-foreground))] shadow-[0_8px_22px_hsl(var(--student-primary)/0.32)]"
                  : "student-panel text-[hsl(var(--student-foreground))]"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}

      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold student-muted-text px-1 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Try asking</p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="w-full student-panel px-4 py-3 text-left text-sm font-bold active:scale-[0.99] transition flex items-center justify-between"
            >
              {s}
              <span className="student-muted-text">›</span>
            </button>
          ))}
        </div>
      )}

      <div className="sticky bottom-24 student-panel p-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type your question..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-[hsl(var(--student-foreground))] placeholder:text-[hsl(var(--student-muted))] focus:outline-none"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] disabled:opacity-40 flex items-center justify-center active:scale-90 transition shadow-[0_8px_18px_hsl(var(--student-primary)/0.32)]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
