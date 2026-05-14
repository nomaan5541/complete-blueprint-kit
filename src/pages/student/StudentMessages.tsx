import { useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { Search, Bell, Megaphone, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

const TABS = ["All", "Unread", "Announcements"] as const;

export default function StudentMessages() {
  const { notifications, loading } = useStudentData();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = (notifications || []).filter((n: any) => {
    if (tab === "Announcements" && n.type !== "announcement") return false;
    if (query && !(`${n.title} ${n.message}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-6 pt-2 relative animate-fade-in">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 student-muted-text" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages"
          className="w-full bg-[hsl(var(--student-surface)/0.7)] border border-[hsl(var(--student-border)/0.7)] rounded-2xl pl-11 pr-4 py-3 text-sm text-[hsl(var(--student-foreground))] placeholder:text-[hsl(var(--student-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--student-primary)/0.4)]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
        {TABS.map((t) => {
          const active = tab === t;
          const count = t === "Unread" ? (notifications?.length || 0) : 0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition ${
                active
                  ? "bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] shadow-[0_8px_18px_hsl(var(--student-primary)/0.32)]"
                  : "bg-[hsl(var(--student-surface)/0.65)] border border-[hsl(var(--student-border)/0.6)] text-[hsl(var(--student-foreground))]"
              }`}
            >
              {t}
              {count > 0 && t === "Unread" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[hsl(var(--student-danger))] text-[10px] font-extrabold">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <StudentEmpty icon={Bell} title="No messages" text="When you receive new messages or announcements they'll show up here." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n: any) => {
            const isAnn = n.type === "announcement";
            const Icon = isAnn ? Megaphone : Bell;
            const tone = isAnn ? "student-tone-violet" : "student-tone-blue";
            return (
              <button key={n.id} className="w-full student-panel p-3.5 flex items-start gap-3 active:scale-[0.99] transition text-left">
                <span className={`student-mini-icon ${tone} h-11 w-11`}><Icon className="h-5 w-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm truncate">{n.title}</p>
                    <span className="text-[10px] student-muted-text shrink-0">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs student-muted-text truncate mt-0.5">{n.message}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate("/student/chat")}
        aria-label="Ask AI"
        className="fixed bottom-28 right-6 h-14 w-14 rounded-full bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] shadow-[0_12px_30px_hsl(var(--student-primary)/0.45)] flex items-center justify-center active:scale-90 transition z-40"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
