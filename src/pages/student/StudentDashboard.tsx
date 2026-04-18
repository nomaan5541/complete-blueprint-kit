import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { format } from "date-fns";
import {
  Calendar, ClipboardCheck, BookOpen, FileText, ClipboardList, BarChart3,
  Video, Users, Bell, Wallet, MessageCircle, CalendarDays, FolderOpen, IdCard, ChevronRight, Sparkles,
} from "lucide-react";

type Shortcut = { label: string; icon: any; to: string; bg: string; fg: string };

const SHORTCUTS: Shortcut[] = [
  { label: "Today's Notes",  icon: BookOpen,      to: "/student/materials",     bg: "bg-violet-100",  fg: "text-violet-600" },
  { label: "Attendance",     icon: ClipboardCheck,to: "/student/attendance",    bg: "bg-emerald-100", fg: "text-emerald-600" },
  { label: "Study Material", icon: FolderOpen,    to: "/student/materials",     bg: "bg-orange-100",  fg: "text-orange-600" },
  { label: "Assignments",    icon: ClipboardList, to: "/student/homework",      bg: "bg-blue-100",    fg: "text-blue-600" },
  { label: "Exams",          icon: FileText,      to: "/student/exam",          bg: "bg-rose-100",    fg: "text-rose-600" },
  { label: "Results",        icon: BarChart3,     to: "/student/results",       bg: "bg-violet-100",  fg: "text-violet-600" },
  { label: "Live Classes",   icon: Video,         to: "/student/meetings",      bg: "bg-emerald-100", fg: "text-emerald-600" },
  { label: "Meetings",       icon: Users,         to: "/student/meetings",      bg: "bg-sky-100",     fg: "text-sky-600" },
  { label: "Notifications",  icon: Bell,          to: "/student/notifications", bg: "bg-amber-100",   fg: "text-amber-600" },
  { label: "Fee Details",    icon: Wallet,        to: "/student/fees",          bg: "bg-teal-100",    fg: "text-teal-600" },
  { label: "Ask Doubt",      icon: MessageCircle, to: "/student/chat",          bg: "bg-blue-100",    fg: "text-blue-600" },
  { label: "Time Table",     icon: CalendarDays,  to: "/student/timetable",     bg: "bg-orange-100",  fg: "text-orange-600" },
  { label: "ID Card",        icon: IdCard,        to: "/student/id-card",       bg: "bg-indigo-100",  fg: "text-indigo-600" },
  { label: "AI Assistant",   icon: Sparkles,      to: "/student/chat",          bg: "bg-fuchsia-100", fg: "text-fuchsia-600" },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { student, timetable, slots, loading } = useStudentData();

  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Monday=0
  const todaysClasses = timetable
    .filter((e: any) => e.day_of_week === dayIdx)
    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0));

  if (loading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="h-24 bg-white dark:bg-card rounded-2xl animate-pulse" />
        <div className="h-8 w-32 bg-white/60 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square bg-white dark:bg-card rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl p-6 text-center shadow-sm mt-2">
        <p className="font-semibold">No student record found</p>
        <p className="text-sm text-muted-foreground mt-1">Please contact your school admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Date card overlapping header */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] truncate">{format(today, "dd MMMM yyyy, EEEE")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Stay focused and keep learning!</p>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 px-3 py-1.5 rounded-full whitespace-nowrap">
          School Day
        </span>
      </div>

      {/* Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Quick Access</h2>
          <button
            onClick={() => navigate("/student/my-class")}
            className="text-xs font-medium text-muted-foreground flex items-center gap-0.5 active:scale-95 transition-transform"
          >
            All Features <ChevronRight className="h-4 w-4" />
          </button>
        </div>

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
      <button
        onClick={() => navigate("/student/timetable")}
        className="w-full bg-white dark:bg-card rounded-2xl p-4 flex items-center gap-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-[0.99] transition-transform text-left"
      >
        <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-blue-600 dark:text-blue-300">Today's Schedule</p>
          <p className="text-xs mt-0.5">You have {todaysClasses.filter((c:any)=>!c.timetable_slots?.is_break).length} classes today</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">View your timetable</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
          <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </div>
      </button>
    </div>
  );
}
