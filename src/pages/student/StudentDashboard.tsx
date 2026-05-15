import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { isThisWeek } from "date-fns";
import {
  Calendar, ClipboardCheck, FileText, ClipboardList, BarChart3,
  Users, Bell, Wallet, Sparkles, CalendarDays, FolderOpen, IdCard,
  ChevronRight, GraduationCap, Bus, BookOpen, User as UserIcon, Trophy,
  Monitor, School, BookMarked, Pencil,
} from "lucide-react";
import { StudentIconTile, StudentPanel, StudentStatTile, TimelineRow } from "@/components/student/StudentUI";
import type { LucideIcon } from "lucide-react";

type Shortcut = { label: string; icon: LucideIcon; to: string; tone: "violet" | "blue" | "green" | "amber" | "rose" | "cyan" | "pink" | "orange"; badge?: number };

export default function StudentDashboard() {
  const navigate = useNavigate();
  const {
    student, school, timetable, homeworkList, onlineExams, notifications,
    attendanceRate, totalDue, loading,
  } = useStudentData();

  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7;
  const todaysClasses = (timetable || [])
    .filter((e: any) => e.day_of_week === dayIdx && !e.timetable_slots?.is_break)
    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0));

  const pendingHw = (homeworkList || []).filter((h: any) => h.due_date && new Date(h.due_date) >= today).length;
  const examsThisWeek = (onlineExams || []).filter((e: any) => e.scheduled_at && isThisWeek(new Date(e.scheduled_at))).length;
  const unreadCount = notifications?.length || 0;

  const shortcuts: Shortcut[] = [
    { label: "My Profile", icon: UserIcon, to: "/student/profile", tone: "violet" },
    { label: "AI Assistant", icon: Sparkles, to: "/student/chat", tone: "blue" },
    { label: "Attendance", icon: ClipboardCheck, to: "/student/attendance", tone: "green" },
    { label: "Exam Results", icon: BarChart3, to: "/student/results", tone: "rose" },
    { label: "Online Exams", icon: Monitor, to: "/student/exam", tone: "blue" },
    { label: "Fees", icon: Wallet, to: "/student/fees", tone: "amber" },
    { label: "Timetable", icon: CalendarDays, to: "/student/timetable", tone: "violet" },
    { label: "Homework", icon: ClipboardList, to: "/student/homework", tone: "pink" },
    { label: "Study Materials", icon: FolderOpen, to: "/student/materials", tone: "blue" },
    { label: "ID Card", icon: IdCard, to: "/student/id-card", tone: "cyan" },
    { label: "Notifications", icon: Bell, to: "/student/notifications", tone: "rose", badge: unreadCount },
    { label: "Meetings", icon: Users, to: "/student/meetings", tone: "green" },
    { label: "Events", icon: Trophy, to: "/student/events", tone: "violet" },
    { label: "Library", icon: BookOpen, to: "/student/library", tone: "blue" },
    { label: "Transport", icon: Bus, to: "/student/transport", tone: "amber" },
  ];

  if (loading) {
    return (
      <div className="space-y-5 pb-6 pt-2">
        <div className="h-28 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />
        <div className="h-36 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
          {Array.from({ length: 15 }).map((_, i) => <div key={i} className="aspect-square rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <StudentPanel className="p-8 text-center mt-3">
        <p className="font-bold">No student record found</p>
        <p className="student-muted-text text-sm mt-1">Please contact your school admin.</p>
      </StudentPanel>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7 pb-6 pt-2 animate-fade-in">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-5">
          <StudentPanel
            as="button"
            onClick={() => navigate("/student/school")}
            className="w-full text-left p-4 sm:p-6 flex items-center gap-4 relative overflow-hidden active:scale-[0.99]"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-3xl bg-[hsl(var(--student-green)/0.16)] border border-[hsl(var(--student-green)/0.24)] flex items-center justify-center">
              <GraduationCap className="h-9 w-9 sm:h-11 sm:w-11 text-[hsl(var(--student-green))]" />
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="font-extrabold text-lg sm:text-3xl truncate">{school?.name || "Your School"}</p>
              <p className="student-muted-text text-sm sm:text-base mt-1 flex items-center gap-2">
                {student.academic_years?.name || "Current Session"} <Calendar className="h-4 w-4" />
              </p>
            </div>
            <School className="absolute right-5 top-1/2 -translate-y-1/2 h-24 w-24 sm:h-32 sm:w-32 text-[hsl(var(--student-green)/0.12)]" strokeWidth={1.4} />
          </StudentPanel>

          <StudentPanel
            as="button"
            onClick={() => navigate("/student/homework")}
            className="w-full text-left p-4 sm:p-6 flex items-center gap-4 bg-[linear-gradient(135deg,hsl(var(--student-violet)/0.24),hsl(var(--student-blue)/0.18),hsl(var(--student-bg)/0.75))] border-[hsl(var(--student-primary)/0.4)] active:scale-[0.99] overflow-hidden"
          >
            <div className="flex-1 min-w-0 z-10">
              <p className="font-extrabold text-base sm:text-2xl">Keep going, {student.name?.split(" ")[0]}! 🌟</p>
              <p className="text-sm sm:text-base text-[hsl(var(--student-foreground)/0.86)] mt-2 leading-relaxed max-w-lg">
                You have <span className="text-[hsl(var(--student-amber))] font-extrabold">{pendingHw}</span> assignments due
                {examsThisWeek > 0 && <> and <span className="text-[hsl(var(--student-rose))] font-extrabold"> {examsThisWeek}</span> exam{examsThisWeek > 1 ? "s" : ""} this week.</>}
              </p>
              <span className="mt-4 h-10 w-10 rounded-full bg-[hsl(var(--student-primary))] flex items-center justify-center shadow-[0_8px_22px_hsl(var(--student-primary)/0.35)]">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
            <div className="relative shrink-0 h-24 w-28 sm:h-32 sm:w-40 flex items-center justify-center">
              <BookMarked className="absolute h-20 w-20 sm:h-28 sm:w-28 text-[hsl(var(--student-blue))] drop-shadow-[0_16px_26px_hsl(var(--student-blue)/0.32)]" strokeWidth={1.4} />
              <GraduationCap className="absolute -top-1 right-2 h-14 w-14 sm:h-20 sm:w-20 text-[hsl(var(--student-amber))] rotate-[-8deg]" strokeWidth={1.5} />
            </div>
          </StudentPanel>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-lg sm:text-2xl font-extrabold">Quick Access</h2>
            <button
              onClick={() => navigate("/student/more")}
              className="text-sm font-semibold text-[hsl(var(--student-primary))] flex items-center gap-1 active:scale-95"
            >
              Customise <Sparkles className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 min-[390px]:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-2.5 sm:gap-3">
            {shortcuts.map((s) => (
              <StudentIconTile key={s.label} icon={s.icon} label={s.label} tone={s.tone} badge={s.badge} onClick={() => navigate(s.to)} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <StudentPanel className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-2xl font-extrabold">Today’s Schedule</h2>
            <button
              onClick={() => navigate("/student/timetable")}
              className="text-sm font-semibold text-[hsl(var(--student-primary))] flex items-center gap-1"
            >
              View Timetable <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {todaysClasses.length === 0 ? (
            <p className="text-center text-sm student-muted-text py-8">No classes scheduled today</p>
          ) : (
            <div className="space-y-0">
              {todaysClasses.slice(0, 4).map((c: any, i: number) => {
                const tones: Shortcut["tone"][] = ["violet", "cyan", "amber", "rose"];
                return (
                  <TimelineRow
                    key={c.id}
                    time={c.timetable_slots?.start_time?.slice(0, 5) || "—"}
                    title={c.subjects?.name || "Class"}
                    subtitle={`${c.room ? `Room ${c.room}` : "Classroom"}${c.teachers?.name ? ` • ${c.teachers.name}` : ""}`}
                    status={i === 0 ? "Ongoing" : "Upcoming"}
                    tone={tones[i % tones.length]}
                  />
                );
              })}
            </div>
          )}
        </StudentPanel>

        <section className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <StudentStatTile label="Attendance" value={`${attendanceRate}%`} subtitle="This Month" icon={ClipboardCheck} tone="green" onClick={() => navigate("/student/attendance")} />
          <StudentStatTile label="Assignments" value={pendingHw} subtitle="Pending" icon={ClipboardList} tone="amber" onClick={() => navigate("/student/homework")} />
          <StudentStatTile label="Exams" value={examsThisWeek} subtitle="This Week" icon={FileText} tone="rose" onClick={() => navigate("/student/exam")} />
          <StudentStatTile label="Fees Due" value={`₹ ${Number(totalDue).toLocaleString()}`} subtitle="Pay Now" icon={Wallet} tone="pink" onClick={() => navigate("/student/fees")} />
        </section>
      </div>
    </div>
  );
}
