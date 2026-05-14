import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { ChevronRight, Users, Presentation, BookOpen, Calendar, ClipboardCheck, ClipboardList, FileText, BarChart3, NotebookPen, Megaphone, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentEmpty, StudentIconTile, StudentPanel, StudentStatTile } from "@/components/student/StudentUI";
import type { LucideIcon } from "lucide-react";

type Tone = "violet" | "blue" | "green" | "amber" | "rose" | "cyan" | "pink" | "orange";
type Shortcut = { label: string; icon: LucideIcon; to: string; tone: Tone };

const SHORTCUTS: Shortcut[] = [
  { label: "Time Table",      icon: Calendar,       to: "/student/timetable",     tone: "violet" },
  { label: "Attendance",      icon: ClipboardCheck, to: "/student/attendance",    tone: "green" },
  { label: "Assignments",     icon: ClipboardList,  to: "/student/homework",      tone: "amber" },
  { label: "Study Materials", icon: BookOpen,       to: "/student/materials",     tone: "blue" },
  { label: "Exams",           icon: FileText,       to: "/student/exam",          tone: "rose" },
  { label: "Results",         icon: BarChart3,      to: "/student/results",       tone: "violet" },
  { label: "Class Notes",     icon: NotebookPen,    to: "/student/materials",     tone: "cyan" },
  { label: "Announcements",   icon: Megaphone,      to: "/student/notifications", tone: "pink" },
];

export default function StudentMyClass() {
  const navigate = useNavigate();
  const { student, timetable, loading } = useStudentData();
  const [classmateCount, setClassmateCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);

  useEffect(() => {
    if (!student?.class_id || !student?.school_id) return;
    (async () => {
      const [{ count: stuCount }, { data: cs }] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true })
          .eq("class_id", student.class_id).eq("status", "active"),
        supabase.from("class_subjects").select("subject_id").eq("class_id", student.class_id),
      ]);
      setClassmateCount(stuCount || 0);
      setSubjectCount(cs?.length || 0);
      const tIds = new Set<string>();
      (timetable || []).forEach((e: any) => { if (e.teachers?.id) tIds.add(e.teachers.id); });
      setTeacherCount(tIds.size);
    })();
  }, [student, timetable]);

  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7;
  const todaysClasses = (timetable || [])
    .filter((e: any) => e.day_of_week === dayIdx && !e.timetable_slots?.is_break)
    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0));

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const classStatus = (entry: any): "completed" | "now" | "upcoming" => {
    const start = entry.timetable_slots?.start_time?.slice(0, 5);
    const end = entry.timetable_slots?.end_time?.slice(0, 5);
    if (!start || !end) return "upcoming";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    if (nowMins >= eMin) return "completed";
    if (nowMins >= sMin && nowMins < eMin) return "now";
    return "upcoming";
  };

  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record" />;

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-5 flex items-center gap-4">
        <div className="student-icon-frame student-tone-violet h-16 w-16">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-xl">Class {student.classes?.name} {student.sections?.name ? `- ${student.sections.name}` : ""}</p>
          <p className="text-xs student-muted-text mt-1">Academic Year {student.academic_years?.name || "—"}</p>
          <p className="text-xs student-muted-text">Total Students: {classmateCount}</p>
        </div>
      </StudentPanel>

      <section>
        <h2 className="text-base font-extrabold mb-3 px-1">Class Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <StudentStatTile icon={Users} value={classmateCount} label="Students" subtitle="In your class" tone="green" />
          <StudentStatTile icon={Presentation} value={teacherCount} label="Teachers" subtitle="Assigned" tone="blue" />
          <StudentStatTile icon={BookOpen} value={subjectCount} label="Subjects" subtitle="Total" tone="violet" />
          <StudentStatTile icon={Calendar} value={todaysClasses.length} label="Today" subtitle="Classes" tone="amber" />
        </div>
      </section>

      <section>
        <h2 className="text-base font-extrabold mb-3 px-1">Quick Access</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {SHORTCUTS.map((s) => (
            <StudentIconTile key={s.label} icon={s.icon} label={s.label} tone={s.tone} onClick={() => navigate(s.to)} />
          ))}
        </div>
      </section>

      <StudentPanel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-extrabold text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-[hsl(var(--student-primary))]" /> Today's Schedule</p>
          <button onClick={() => navigate("/student/timetable")} className="text-xs font-bold text-[hsl(var(--student-primary))] flex items-center gap-0.5 active:scale-95 transition">
            Full Timetable <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {todaysClasses.length === 0 ? (
          <p className="text-sm student-muted-text text-center py-6">No classes today</p>
        ) : (
          <div className="divide-y divide-[hsl(var(--student-border)/0.5)]">
            {todaysClasses.map((e: any, i: number) => {
              const status = classStatus(e);
              const chip = status === "completed"
                ? "bg-[hsl(var(--student-green)/0.16)] text-[hsl(var(--student-green))]"
                : status === "now"
                ? "bg-[hsl(var(--student-primary)/0.18)] text-[hsl(var(--student-primary))]"
                : "bg-[hsl(var(--student-surface-2)/0.7)] student-muted-text";
              return (
                <div key={e.id} className="flex items-center gap-3 py-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] text-xs font-extrabold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{e.subjects?.name || "Subject"}</p>
                    <p className="text-[11px] student-muted-text">
                      {e.timetable_slots?.start_time?.slice(0, 5)} - {e.timetable_slots?.end_time?.slice(0, 5)}
                      {e.teachers?.name && ` · ${e.teachers.name}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${chip}`}>
                    {status === "completed" ? "Done" : status === "now" ? "Now" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </StudentPanel>
    </div>
  );
}
