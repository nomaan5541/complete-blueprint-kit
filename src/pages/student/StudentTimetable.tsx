import { useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { Coffee } from "lucide-react";
import { StudentEmpty, StudentPanel, formatDisplayTime } from "@/components/student/StudentUI";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentTimetable() {
  const { student, timetable, slots, loading } = useStudentData();
  const today = (new Date().getDay() + 6) % 7;
  const [activeDay, setActiveDay] = useState(today < 6 ? today : 0);
  const [tab, setTab] = useState<"my" | "exam">("my");

  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const dayEntries = timetable.filter((e: any) => e.day_of_week === activeDay);

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-1.5 grid grid-cols-2 gap-1">
        {(["my", "exam"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 rounded-2xl text-sm font-bold transition ${
              tab === t
                ? "bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] shadow-[0_8px_22px_hsl(var(--student-primary)/0.4)]"
                : "student-muted-text"
            }`}
          >
            {t === "my" ? "My Timetable" : "Exam Timetable"}
          </button>
        ))}
      </StudentPanel>

      <div className="grid grid-cols-6 gap-1.5">
        {DAYS.map((d, i) => {
          const active = activeDay === i;
          const isToday = i === today;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(i)}
              className={`py-2.5 rounded-2xl text-xs font-bold transition active:scale-95 ${
                active
                  ? "bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] shadow-[0_8px_18px_hsl(var(--student-primary)/0.3)]"
                  : "bg-[hsl(var(--student-surface)/0.65)] border border-[hsl(var(--student-border)/0.6)] text-[hsl(var(--student-foreground))]"
              }`}
            >
              <span className="block">{d}</span>
              {isToday && !active && <span className="block mt-0.5 h-1 w-1 rounded-full bg-[hsl(var(--student-primary))] mx-auto" />}
            </button>
          );
        })}
      </div>

      {tab === "exam" ? (
        <StudentEmpty title="No exam schedule yet" text="Exam timetable will appear here once published by your school." />
      ) : slots.length === 0 ? (
        <StudentEmpty title="Timetable not set yet" text="Your school admin hasn't published the timetable." />
      ) : (
        <div className="space-y-0">
          {slots.map((slot: any) => {
            const entry = dayEntries.find((e: any) => e.timetable_slots?.slot_order === slot.slot_order);
            const [hour, suffix] = formatDisplayTime(slot.start_time?.slice(0, 5)).split(" ");
            return (
              <div key={slot.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-2">
                <div className="rounded-2xl bg-[hsl(var(--student-surface-2)/0.5)] border border-[hsl(var(--student-border)/0.5)] py-2 text-center self-start">
                  <p className="text-base font-extrabold tabular-nums leading-none">{hour}</p>
                  <p className="text-[10px] student-muted-text font-bold mt-1">{suffix}</p>
                </div>
                <div className="student-panel-soft rounded-2xl px-4 py-3 min-w-0">
                  {slot.is_break ? (
                    <p className="text-sm font-bold student-muted-text italic flex items-center gap-2"><Coffee className="h-4 w-4" /> Break</p>
                  ) : entry ? (
                    <>
                      <p className="font-bold text-sm">{entry.subjects?.name || "Class"}</p>
                      <p className="text-[11px] student-muted-text mt-1">
                        {entry.room ? `Room ${entry.room}` : "Classroom"}{entry.teachers?.name && ` • ${entry.teachers.name}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm student-muted-text">Free period</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
