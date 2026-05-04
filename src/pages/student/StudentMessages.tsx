import { useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { Search, Bell, Megaphone, MessageCircle, Bot, Pencil } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const TABS = ["All", "Unread", "Announcements", "Chats"] as const;

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
    <div className="space-y-4 pb-6 pt-2 relative">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages"
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
        {TABS.map((t) => {
          const active = tab === t;
          const count = t === "Unread" ? (notifications?.length || 0) : 0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                active ? "bg-indigo-500 text-white" : "bg-white/5 border border-white/10 text-slate-300"
              }`}
            >
              {t} {count > 0 && t === "Unread" && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px]">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No messages</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n: any) => {
            const Icon = n.type === "announcement" ? Megaphone : Bell;
            const colorBg = n.type === "announcement" ? "bg-violet-500/20" : "bg-blue-500/20";
            const colorFg = n.type === "announcement" ? "text-violet-300" : "text-blue-300";
            return (
              <button
                key={n.id}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 active:scale-[0.99] transition text-left"
              >
                <div className={`h-11 w-11 shrink-0 rounded-full ${colorBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${colorFg}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm truncate">{n.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{n.message}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating compose button (decorative for AI chat) */}
      <button
        onClick={() => navigate("/student/chat")}
        aria-label="Ask AI"
        className="fixed bottom-28 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_8px_24px_rgba(99,102,241,0.5)] flex items-center justify-center active:scale-90 transition z-40"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
