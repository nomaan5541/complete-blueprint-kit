import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { ChevronRight, Users, Presentation, BookOpen, Calendar, ClipboardCheck, ClipboardList, FolderOpen, FileText, BarChart3, NotebookPen, Megaphone, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SHORTCUTS = [
  { label: "Time Table",     icon: Calendar,       to: "/student/timetable",     bg: "bg-violet-100",  fg: "text-violet-600" },
  { label: "Attendance",     icon: ClipboardCheck, to: "/student/attendance",    bg: "bg-emerald-100", fg: "text-emerald-600" },
  { label: "Assignments",    icon: ClipboardList,  to: "/student/homework",      bg: "bg-orange-100",  fg: "text-orange-600" },
  { label: "Study Materials",icon: BookOpen,       to: "/student/materials",     bg: "bg-blue-100",    fg: "text-blue-600" },
  { label: "Exams",          icon: FileText,       to: "/student/exam",          bg: "bg-rose-100",    fg: "text-rose-600" },
  { label: "Results",        icon: BarChart3,      to: "/student/results",       bg: "bg-violet-100",  fg: "text-violet-600" },
  { label: "Class Notes",    icon: NotebookPen,    to: "/student/materials",     bg: "bg-teal-100",    fg: "text-teal-600" },
  { label: "Announcements",  icon: Megaphone,      to: "/student/notifications", bg: "bg-orange-100",  fg: "text-orange-600" },
];

export default function StudentMyClass() {
  const navigate = useNavigate();
  const { student, timetable, loading } = useStudentData();
  const [classmateCount, setClassmateCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [subjectCount, setSubjectCount] = useState<number>(0);

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
      // distinct teachers from timetable
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
  const classStatus = (entry: any): "completed" | "next" | "upcoming" => {
    const start = entry.timetable_slots?.start_time?.slice(0, 5);
    const end = entry.timetable_slots?.end_time?.slice(0, 5);
    if (!start || !end) return "upcoming";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    if (nowMins >= eMin) return "completed";
    if (nowMins >= sMin && nowMins < eMin) return "next";
    return "upcoming";
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="h-28 bg-white dark:bg-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!student) return <div className="bg-white dark:bg-card rounded-2xl p-6 text-center mt-2">No student record</div>;

  return (
    <div className="space-y-5 pb-6">
      {/* Class info */}
      <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base">Class {student.classes?.name} {student.sections?.name ? `- ${student.sections.name}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Academic Year {student.academic_years?.name || "—"}</p>
          <p className="text-xs text-muted-foreground">Total Students: {classmateCount}</p>
        </div>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-lg font-bold mb-3 px-1">Class Overview</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <StatTile icon={Users} value={classmateCount} label="Students" bg="bg-emerald-100" fg="text-emerald-600" />
          <StatTile icon={Presentation} value={teacherCount} label="Teachers" bg="bg-blue-100" fg="text-blue-600" />
          <StatTile icon={BookOpen} value={subjectCount} label="Subjects" bg="bg-violet-100" fg="text-violet-600" />
          <StatTile icon={Calendar} value={todaysClasses.length} label="Today's Classes" bg="bg-orange-100" fg="text-orange-600" />
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-lg font-bold mb-3 px-1">Quick Access</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.to)}
              className="bg-white dark:bg-card rounded-2xl p-2.5 flex flex-col items-center gap-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-95 transition-transform"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.bg} dark:bg-opacity-15`}>
                <s.icon className={`h-5 w-5 ${s.fg}`} />
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Today's Schedule</p>
          <button onClick={() => navigate("/student/timetable")} className="text-xs font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-0.5 active:scale-95 transition-transform">
            View Full Timetable <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {todaysClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No classes today</p>
        ) : (
          <div className="divide-y divide-border/60">
            {todaysClasses.map((e: any, i: number) => {
              const status = classStatus(e);
              return (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{e.subjects?.name || "Subject"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.timetable_slots?.start_time?.slice(0, 5)} - {e.timetable_slots?.end_time?.slice(0, 5)}
                      {e.teachers?.name && <> · {e.teachers.name}</>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    status === "completed" ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300" :
                    status === "next" ? "text-blue-700 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300" :
                    "text-muted-foreground bg-muted"
                  }`}>
                    {status === "completed" ? "Completed" : status === "next" ? "Now" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, bg, fg }: any) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center gap-3">
      <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${bg} dark:bg-opacity-15`}>
        <Icon className={`h-5 w-5 ${fg}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}
