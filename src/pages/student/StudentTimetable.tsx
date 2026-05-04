import { useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentTimetable() {
  const { student, timetable, slots, loading } = useStudentData();
  const today = (new Date().getDay() + 6) % 7;
  const [activeDay, setActiveDay] = useState(today < 6 ? today : 0);
  const [tab, setTab] = useState<"my" | "exam">("my");

  if (loading) return <div className="pt-4 h-64 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  const dayEntries = timetable.filter((e: any) => e.day_of_week === activeDay);

  return (
    <div className="space-y-4 pb-6 pt-2">
      {/* Tab switcher */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-1 grid grid-cols-2 gap-1">
        <button
          onClick={() => setTab("my")}
          className={`py-2 rounded-xl text-sm font-semibold transition ${
            tab === "my" ? "bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]" : "text-slate-400"
          }`}
        >My Timetable</button>
        <button
          onClick={() => setTab("exam")}
          className={`py-2 rounded-xl text-sm font-semibold transition ${
            tab === "exam" ? "bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]" : "text-slate-400"
          }`}
        >Exam Timetable</button>
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-6 gap-1">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setActiveDay(i)}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeDay === i ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {slots.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-400">Timetable not set yet</p>
        ) : (
          slots.map((slot: any) => {
            const entry = dayEntries.find((e: any) => e.timetable_slots?.slot_order === slot.slot_order);
            const start = slot.start_time?.slice(0, 5) || "—";
            const [hh, mm] = start.split(":");
            const ampm = Number(hh) >= 12 ? "PM" : "AM";
            const h12 = ((Number(hh) + 11) % 12) + 1;
            return (
              <div key={slot.id} className="flex items-stretch gap-3 py-2">
                <div className="text-center shrink-0 w-16">
                  <p className="text-base font-extrabold tabular-nums">{h12.toString().padStart(2,"0")}:{mm}</p>
                  <p className="text-[10px] text-slate-400">{ampm}</p>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  {slot.is_break ? (
                    <p className="text-sm font-semibold text-slate-400 italic">Break</p>
                  ) : entry ? (
                    <>
                      <p className="font-bold text-sm">{entry.subjects?.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {entry.room ? `Room ${entry.room}` : "Classroom"}{entry.teachers?.name && ` • ${entry.teachers.name}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">—</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
