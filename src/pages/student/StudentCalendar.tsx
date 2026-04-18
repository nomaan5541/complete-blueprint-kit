import { useEffect, useMemo, useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, PartyPopper, CalendarCheck, BookOpen } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isToday } from "date-fns";

// Major Indian holidays (recurring; year-agnostic where possible). Date-specific entries are added per-year via simple lookup.
// Approx dates for 2024–2026 — admin-declared holidays in DB will appear too.
const INDIAN_HOLIDAYS: { date: string; name: string }[] = [
  { date: "01-26", name: "Republic Day" },
  { date: "08-15", name: "Independence Day" },
  { date: "10-02", name: "Gandhi Jayanti" },
  { date: "12-25", name: "Christmas" },
  { date: "01-01", name: "New Year" },
  // Festival dates (approx; will roughly match each year)
  { date: "03-25", name: "Holi" },
  { date: "11-01", name: "Diwali" },
  { date: "08-19", name: "Raksha Bandhan" },
  { date: "09-07", name: "Ganesh Chaturthi" },
  { date: "10-12", name: "Dussehra" },
  { date: "04-14", name: "Ambedkar Jayanti" },
  { date: "05-01", name: "Labour Day" },
];

export default function StudentCalendar() {
  const { student, timetable } = useStudentData();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [schoolEvents, setSchoolEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!student?.school_id) return;
    (async () => {
      const { data } = await supabase
        .from("school_events")
        .select("*")
        .eq("school_id", student.school_id)
        .order("start_date", { ascending: true });
      setSchoolEvents(data || []);
    })();
  }, [student]);

  const { days, monthStart } = useMemo(() => {
    const ms = startOfMonth(cursor);
    const me = endOfMonth(cursor);
    return { days: eachDayOfInterval({ start: ms, end: me }), monthStart: ms };
  }, [cursor]);
  const leadingBlanks = (getDay(monthStart) + 6) % 7; // Monday-first

  const isHoliday = (d: Date) => {
    const md = format(d, "MM-dd");
    return INDIAN_HOLIDAYS.find(h => h.date === md);
  };
  const eventsOn = (d: Date) =>
    schoolEvents.filter(e => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : start;
      return d >= new Date(start.toDateString()) && d <= new Date(end.toDateString());
    });

  const selectedHoliday = isHoliday(selected);
  const selectedEvents = eventsOn(selected);

  // Next classes (today + future this week)
  const dayIdx = (selected.getDay() + 6) % 7;
  const dayClasses = (timetable || [])
    .filter((e: any) => e.day_of_week === dayIdx && !e.timetable_slots?.is_break)
    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0));

  return (
    <div className="space-y-5 pb-6">
      {/* Calendar */}
      <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous month" className="h-9 w-9 rounded-full hover:bg-muted active:scale-90 transition flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="font-bold text-base">{format(cursor, "MMMM yyyy")}</p>
          <button onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month" className="h-9 w-9 rounded-full hover:bg-muted active:scale-90 transition flex items-center justify-center">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
          {days.map((d) => {
            const hol = isHoliday(d);
            const ev = eventsOn(d).length > 0;
            const sel = isSameDay(d, selected);
            const today = isToday(d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition active:scale-90 ${
                  sel ? "bg-[#4338ca] text-white" :
                  today ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" :
                  hol ? "text-rose-600" : ""
                }`}
              >
                <span className="leading-none">{format(d, "d")}</span>
                {(hol || ev) && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${sel ? "bg-white" : ev ? "bg-orange-500" : "bg-rose-500"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Holiday</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> School Event</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Today</span>
        </div>
      </div>

      {/* Selected day details */}
      <div className="space-y-3">
        <p className="font-bold px-1">{format(selected, "EEEE, dd MMMM yyyy")}</p>

        {selectedHoliday && (
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-card flex items-center justify-center"><PartyPopper className="h-5 w-5 text-rose-600" /></div>
            <div>
              <p className="font-bold text-sm">{selectedHoliday.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">National holiday — no school</p>
            </div>
          </div>
        )}

        {selectedEvents.map(ev => (
          <div key={ev.id} className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center"><CalendarCheck className="h-5 w-5 text-orange-600 dark:text-orange-300" /></div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{ev.title}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{ev.event_type} · declared by school</p>
              {ev.description && <p className="text-xs mt-1.5 text-muted-foreground line-clamp-2">{ev.description}</p>}
            </div>
          </div>
        ))}

        {!selectedHoliday && dayClasses.length > 0 && (
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="font-bold text-sm flex items-center gap-2 mb-2"><BookOpen className="h-4 w-4" /> Classes ({dayClasses.length})</p>
            <div className="divide-y divide-border/60">
              {dayClasses.map((e: any, i: number) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{e.subjects?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {e.timetable_slots?.start_time?.slice(0, 5)} - {e.timetable_slots?.end_time?.slice(0, 5)}
                      {e.teachers?.name && <> · {e.teachers.name}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedHoliday && dayClasses.length === 0 && selectedEvents.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No classes or events</div>
        )}
      </div>
    </div>
  );
}
