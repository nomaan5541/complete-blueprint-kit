import { useEffect, useMemo, useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { format, addMonths, subMonths, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { StudentPanel, formatDisplayTime } from "@/components/student/StudentUI";

const INDIAN_HOLIDAYS: Record<string, string> = {
  "01-26": "Republic Day", "08-15": "Independence Day", "10-02": "Gandhi Jayanti",
  "12-25": "Christmas", "01-01": "New Year", "03-25": "Holi", "11-01": "Diwali",
  "08-19": "Raksha Bandhan", "09-07": "Ganesh Chaturthi", "10-12": "Dussehra",
  "04-14": "Ambedkar Jayanti", "05-01": "Labour Day",
};

const TONES = ["violet", "blue", "green", "amber", "rose", "cyan", "pink"] as const;

export default function StudentCalendar() {
  const { student, timetable } = useStudentData();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!student?.school_id) return;
    (async () => {
      const { data } = await supabase.from("school_events").select("*").eq("school_id", student.school_id);
      setEvents(data || []);
    })();
  }, [student]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const dayIdx = (selected.getDay() + 6) % 7;
  const dayClasses = (timetable || [])
    .filter((e: any) => e.day_of_week === dayIdx && !e.timetable_slots?.is_break)
    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0));

  const md = format(selected, "MM-dd");
  const holiday = INDIAN_HOLIDAYS[md];
  const dayEvents = events.filter((e: any) => {
    const start = new Date(e.start_date);
    const end = e.end_date ? new Date(e.end_date) : start;
    return selected >= new Date(start.toDateString()) && selected <= new Date(end.toDateString());
  });

  return (
    <div className="space-y-5 pb-6 pt-2 relative animate-fade-in">
      <StudentPanel className="px-3 py-3 flex items-center justify-between">
        <button onClick={() => { const d = subMonths(cursor, 1); setCursor(d); setSelected(d); }} className="student-header-button h-9 w-9">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-extrabold text-base text-center">{format(selected, "MMMM yyyy")}</p>
        <button onClick={() => { const d = addMonths(cursor, 1); setCursor(d); setSelected(d); }} className="student-header-button h-9 w-9">
          <ChevronRight className="h-4 w-4" />
        </button>
      </StudentPanel>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => {
          const sel = isSameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition active:scale-95 ${
                sel
                  ? "bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] shadow-[0_8px_22px_hsl(var(--student-primary)/0.4)]"
                  : "bg-[hsl(var(--student-surface)/0.6)] border border-[hsl(var(--student-border)/0.55)] text-[hsl(var(--student-foreground))]"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${sel ? "" : "student-muted-text"}`}>
                {format(d, "EEE").slice(0, 3)}
              </span>
              <span className={`text-base font-extrabold ${isToday(d) && !sel ? "text-[hsl(var(--student-primary))]" : ""}`}>{format(d, "d")}</span>
            </button>
          );
        })}
      </div>

      {holiday && (
        <StudentPanel className="p-4 text-center bg-[hsl(var(--student-rose)/0.12)] border-[hsl(var(--student-rose)/0.32)]">
          <p className="text-sm font-extrabold text-[hsl(var(--student-rose))]">🎉 {holiday}</p>
          <p className="text-[11px] student-muted-text mt-0.5">National holiday — no school</p>
        </StudentPanel>
      )}

      <div className="space-y-0">
        {dayClasses.length === 0 && dayEvents.length === 0 && !holiday && (
          <p className="text-center py-12 text-sm student-muted-text">No classes or events</p>
        )}

        {dayClasses.map((c: any, i: number) => {
          const tone = TONES[i % TONES.length];
          const [hour, suffix] = formatDisplayTime(c.timetable_slots?.start_time?.slice(0, 5)).split(" ");
          return (
            <div key={c.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-2">
              <div className={`rounded-2xl py-2 text-center self-start bg-[hsl(var(--student-${tone})/0.16)] text-[hsl(var(--student-${tone}))]`}>
                <p className="text-base font-extrabold tabular-nums leading-none">{hour}</p>
                <p className="text-[10px] font-bold mt-1 opacity-90">{suffix}</p>
              </div>
              <div className="student-panel-soft rounded-2xl px-4 py-3 min-w-0">
                <p className="font-bold text-sm truncate">{c.subjects?.name}</p>
                <p className="text-[11px] student-muted-text truncate mt-0.5">
                  {c.room ? `Room ${c.room}` : "Classroom"}{c.teachers?.name && ` • ${c.teachers.name}`}
                </p>
              </div>
            </div>
          );
        })}

        {dayEvents.map((ev: any) => (
          <div key={ev.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-2">
            <div className="rounded-2xl py-2 text-center self-start bg-[hsl(var(--student-orange)/0.16)] text-[hsl(var(--student-orange))] flex flex-col items-center justify-center">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-extrabold mt-1">EVENT</span>
            </div>
            <StudentPanel className="px-4 py-3 min-w-0 bg-[hsl(var(--student-orange)/0.1)] border-[hsl(var(--student-orange)/0.28)]">
              <p className="font-bold text-sm">{ev.title}</p>
              {ev.description && <p className="text-[11px] student-muted-text mt-1 line-clamp-2">{ev.description}</p>}
            </StudentPanel>
          </div>
        ))}
      </div>
    </div>
  );
}
