import { useEffect, useMemo, useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addMonths, subMonths, startOfWeek, addDays, isSameDay, isToday } from "date-fns";

const INDIAN_HOLIDAYS: Record<string, string> = {
  "01-26": "Republic Day", "08-15": "Independence Day", "10-02": "Gandhi Jayanti",
  "12-25": "Christmas", "01-01": "New Year", "03-25": "Holi", "11-01": "Diwali",
  "08-19": "Raksha Bandhan", "09-07": "Ganesh Chaturthi", "10-12": "Dussehra",
  "04-14": "Ambedkar Jayanti", "05-01": "Labour Day",
};

const SLOT_COLORS = [
  { dot: "bg-violet-400", chip: "bg-violet-500/15 text-violet-300" },
  { dot: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300" },
  { dot: "bg-amber-400", chip: "bg-amber-500/15 text-amber-300" },
  { dot: "bg-rose-400", chip: "bg-rose-500/15 text-rose-300" },
  { dot: "bg-cyan-400", chip: "bg-cyan-500/15 text-cyan-300" },
  { dot: "bg-fuchsia-400", chip: "bg-fuchsia-500/15 text-fuchsia-300" },
];

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

  // Week strip — week containing the selected date
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
    <div className="space-y-4 pb-6 pt-2 relative">
      {/* Month header */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => { const d = subMonths(cursor, 1); setCursor(d); setSelected(d); }} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-bold text-base min-w-[140px] text-center">{format(selected, "MMMM yyyy")}</p>
        <button onClick={() => { const d = addMonths(cursor, 1); setCursor(d); setSelected(d); }} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => {
          const sel = isSameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-2xl transition active:scale-95 ${
                sel ? "bg-indigo-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]" : "bg-white/5 text-slate-300"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${sel ? "text-indigo-100" : "text-slate-400"}`}>
                {format(d, "EEE").slice(0, 3)}
              </span>
              <span className={`text-base font-bold ${isToday(d) && !sel ? "text-indigo-300" : ""}`}>{format(d, "d")}</span>
            </button>
          );
        })}
      </div>

      {/* Holiday banner */}
      {holiday && (
        <div className="bg-rose-500/15 border border-rose-400/30 rounded-2xl p-3 text-center">
          <p className="text-sm font-bold text-rose-300">🎉 {holiday}</p>
          <p className="text-[11px] text-slate-300 mt-0.5">National holiday — no school</p>
        </div>
      )}

      {/* Schedule timeline */}
      <div className="space-y-0">
        {dayClasses.length === 0 && dayEvents.length === 0 && !holiday && (
          <p className="text-center py-12 text-sm text-slate-400">No classes or events</p>
        )}

        {dayClasses.map((c: any, i: number) => {
          const start = c.timetable_slots?.start_time?.slice(0, 5) || "—";
          const color = SLOT_COLORS[i % SLOT_COLORS.length];
          const [hh, mm] = start.split(":");
          const ampm = Number(hh) >= 12 ? "PM" : "AM";
          const h12 = ((Number(hh) + 11) % 12) + 1;
          return (
            <div key={c.id} className="flex items-stretch gap-3 py-2">
              <div className="text-center shrink-0 w-16">
                <p className="text-base font-extrabold tabular-nums">{h12.toString().padStart(2,"0")}:{mm}</p>
                <p className="text-[10px] text-slate-400">{ampm}</p>
              </div>
              <div className={`flex-1 bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3`}>
                <div className={`h-2 w-2 rounded-full ${color.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{c.subjects?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {c.room ? `Room ${c.room}` : "Classroom"}{c.teachers?.name && ` • ${c.teachers.name}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {dayEvents.map((ev: any) => (
          <div key={ev.id} className="flex items-stretch gap-3 py-2">
            <div className="text-center shrink-0 w-16 text-orange-300 text-xs font-bold">EVENT</div>
            <div className="flex-1 bg-orange-500/10 border border-orange-400/20 rounded-2xl p-3.5">
              <p className="font-bold text-sm">{ev.title}</p>
              {ev.description && <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{ev.description}</p>}
            </div>
          </div>
        ))}
      </div>

      <button
        aria-label="Add event"
        className="fixed bottom-28 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_8px_24px_rgba(99,102,241,0.5)] flex items-center justify-center active:scale-90 transition z-40"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
