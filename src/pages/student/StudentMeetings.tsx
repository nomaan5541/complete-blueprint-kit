import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Loader2, Video, ExternalLink, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentMeetings() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!schoolId || !user) return;
      setLoading(true);
      const { data } = await supabase
        .from("meetings")
        .select("*, classes(name), subjects(name), sections(name), teachers(name)")
        .eq("school_id", schoolId)
        .in("status", ["live", "scheduled"])
        .order("scheduled_start", { ascending: true });
      setMeetings(data || []);
      setLoading(false);
    })();
  }, [schoolId, user]);

  const live = meetings.filter((m) => m.status === "live");
  const scheduled = meetings.filter((m) => m.status === "scheduled");

  if (loading) return <div className="pt-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin student-muted-text" /></div>;

  return (
    <div className="space-y-6 pb-6 pt-2 animate-fade-in">
      {live.length > 0 && (
        <section>
          <h2 className="text-base font-extrabold mb-3 px-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--student-rose))] animate-pulse shadow-[0_0_12px_hsl(var(--student-rose))]" />
            Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <StudentPanel key={m.id} className="p-4 space-y-3 bg-[hsl(var(--student-green)/0.08)] border-[hsl(var(--student-green)/0.3)]">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-sm leading-snug line-clamp-2">{m.title}</p>
                  <span className="shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-full bg-[hsl(var(--student-rose)/0.16)] text-[hsl(var(--student-rose))]">🔴 LIVE</span>
                </div>
                <p className="text-xs student-muted-text flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {m.teachers?.name || "Teacher"}</p>
                {m.classes?.name && <p className="text-[11px] student-muted-text">{m.classes.name}{m.subjects?.name && ` • ${m.subjects.name}`}</p>}
                {m.description && <p className="text-xs student-muted-text line-clamp-2">{m.description}</p>}
                <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--student-green)),hsl(var(--student-cyan)))] text-[hsl(var(--student-bg))] font-extrabold text-sm shadow-[0_8px_22px_hsl(var(--student-green)/0.4)] active:scale-[0.99] transition">
                  <ExternalLink className="h-4 w-4" /> Join Class
                </a>
              </StudentPanel>
            ))}
          </div>
        </section>
      )}

      {scheduled.length > 0 && (
        <section>
          <h2 className="text-base font-extrabold mb-3 px-1">Upcoming</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scheduled.map((m) => (
              <StudentPanel key={m.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-sm leading-snug line-clamp-2">{m.title}</p>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-[hsl(var(--student-blue)/0.16)] text-[hsl(var(--student-blue))]">Upcoming</span>
                </div>
                <p className="text-xs student-muted-text flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {m.teachers?.name || "Teacher"}</p>
                <p className="text-xs student-muted-text flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(m.scheduled_start), "MMM d, hh:mm a")}</p>
                {m.classes?.name && <p className="text-[11px] student-muted-text">{m.classes.name}{m.subjects?.name && ` • ${m.subjects.name}`}</p>}
              </StudentPanel>
            ))}
          </div>
        </section>
      )}

      {meetings.length === 0 && (
        <StudentEmpty icon={Video} title="No live classes right now" text="When your teacher starts a live class, it will appear here for you to join." />
      )}
    </div>
  );
}
