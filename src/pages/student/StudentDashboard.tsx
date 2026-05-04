import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { format, isToday, isThisWeek } from "date-fns";
import {
  Calendar, ClipboardCheck, BookOpen, FileText, ClipboardList, BarChart3,
  Video, Users, Bell, Wallet, Sparkles, CalendarDays, FolderOpen, IdCard,
  ChevronRight, GraduationCap, Bus, BookMarked, User as UserIcon, Trophy,
} from "lucide-react";

type Shortcut = { label: string; icon: any; to: string; gradient: string; iconColor: string; badge?: number };

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

  const pendingHw = (homeworkList || []).filter((h: any) => new Date(h.due_date) >= today).length;
  const examsThisWeek = (onlineExams || []).filter((e: any) => e.scheduled_at && isThisWeek(new Date(e.scheduled_at))).length;
  const unreadCount = notifications?.length || 0;

  const SHORTCUTS: Shortcut[] = [
    { label: "My Profile",    icon: UserIcon,     to: "/student/profile",       gradient: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-300" },
    { label: "AI Assistant",  icon: Sparkles,     to: "/student/chat",          gradient: "from-blue-500/20 to-cyan-500/20",     iconColor: "text-cyan-300" },
    { label: "Attendance",    icon: ClipboardCheck,to: "/student/attendance",   gradient: "from-emerald-500/20 to-teal-500/20",  iconColor: "text-emerald-300" },
    { label: "Exam Results",  icon: BarChart3,    to: "/student/results",       gradient: "from-rose-500/20 to-pink-500/20",     iconColor: "text-rose-300" },
    { label: "Online Exams",  icon: FileText,     to: "/student/exam",          gradient: "from-sky-500/20 to-blue-500/20",      iconColor: "text-sky-300" },

    { label: "Fees",          icon: Wallet,       to: "/student/fees",          gradient: "from-amber-500/20 to-orange-500/20",  iconColor: "text-amber-300" },
    { label: "Timetable",     icon: CalendarDays, to: "/student/timetable",     gradient: "from-fuchsia-500/20 to-purple-500/20",iconColor: "text-fuchsia-300" },
    { label: "Homework",      icon: ClipboardList,to: "/student/homework",      gradient: "from-pink-500/20 to-rose-500/20",     iconColor: "text-pink-300" },
    { label: "Study Materials",icon: FolderOpen,  to: "/student/materials",     gradient: "from-blue-500/20 to-indigo-500/20",   iconColor: "text-blue-300" },
    { label: "ID Card",       icon: IdCard,       to: "/student/id-card",       gradient: "from-cyan-500/20 to-sky-500/20",      iconColor: "text-cyan-300" },

    { label: "Notifications", icon: Bell,         to: "/student/notifications", gradient: "from-rose-500/20 to-red-500/20",      iconColor: "text-rose-300", badge: unreadCount },
    { label: "Meetings",      icon: Users,        to: "/student/meetings",      gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-300" },
    { label: "Activity",      icon: Trophy,       to: "/student/activity",      gradient: "from-violet-500/20 to-indigo-500/20", iconColor: "text-violet-300" },
    { label: "My Class",      icon: BookMarked,   to: "/student/my-class",      gradient: "from-orange-500/20 to-amber-500/20",  iconColor: "text-orange-300" },
    { label: "Live Class",    icon: Video,        to: "/student/meetings",      gradient: "from-yellow-500/20 to-amber-500/20",  iconColor: "text-yellow-300" },
  ];

  if (loading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mt-2">
        <p className="font-semibold">No student record found</p>
        <p className="text-sm text-slate-400 mt-1">Please contact your school admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6 pt-2">
      {/* School card */}
      <button
        onClick={() => navigate("/student/school")}
        className="w-full text-left bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition relative overflow-hidden"
      >
        <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="font-bold text-base truncate">{school?.name || "Your School"}</p>
          <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {student.academic_years?.name || "Current Session"}
          </p>
        </div>
        <svg aria-hidden viewBox="0 0 100 60" className="absolute right-2 top-1/2 -translate-y-1/2 h-16 w-24 text-emerald-300/15 pointer-events-none">
          <path fill="currentColor" d="M50 5 L90 25 L90 55 L10 55 L10 25 Z M30 35 L30 55 L45 55 L45 35 Z M55 35 L55 55 L70 55 L70 35 Z" />
        </svg>
      </button>

      {/* Motivational card */}
      <button
        onClick={() => navigate("/student/homework")}
        className="w-full text-left rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-purple-500/10 border border-indigo-400/30 active:scale-[0.99] transition relative overflow-hidden"
      >
        <div className="flex-1 min-w-0 z-10">
          <p className="font-bold text-base">Keep going, {student.name?.split(" ")[0]}! <span>🌟</span></p>
          <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
            You have <span className="text-amber-300 font-bold">{pendingHw}</span> assignments due
            {examsThisWeek > 0 && <> and <span className="text-rose-300 font-bold">{examsThisWeek}</span> exam{examsThisWeek > 1 ? "s" : ""} this week.</>}
          </p>
          <div className="mt-3 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
        <div className="text-5xl shrink-0 relative z-10">📚</div>
      </button>

      {/* Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-base font-bold">Quick Access</h2>
          <button
            onClick={() => navigate("/student/more")}
            className="text-xs font-medium text-indigo-300 flex items-center gap-1 active:scale-95"
          >
            Customise <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.to)}
              className={`relative bg-gradient-to-br ${s.gradient} border border-white/10 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition min-h-[88px]`}
            >
              {s.badge && s.badge > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-bold flex items-center justify-center">
                  {s.badge > 9 ? "9+" : s.badge}
                </span>
              )}
              <s.icon className={`h-6 w-6 ${s.iconColor}`} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 text-slate-200">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Today's Schedule</h2>
          <button
            onClick={() => navigate("/student/timetable")}
            className="text-xs font-medium text-indigo-300 flex items-center gap-0.5"
          >
            View Timetable <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {todaysClasses.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No classes scheduled today</p>
        ) : (
          <div className="space-y-0">
            {todaysClasses.slice(0, 4).map((c: any, i: number) => {
              const startTime = c.timetable_slots?.start_time?.slice(0, 5) || "—";
              const status = i === 0 ? "Ongoing" : "Upcoming";
              const statusColor = i === 0 ? "bg-violet-500/20 text-violet-300" : "bg-blue-500/20 text-blue-300";
              const dotColor = ["bg-violet-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400"][i % 4];
              return (
                <div key={c.id} className="flex items-stretch gap-3 py-2.5">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-xs font-bold text-slate-300">{startTime.split(":")[0]}:{startTime.split(":")[1]}</p>
                    <p className="text-[9px] text-slate-500">AM</p>
                  </div>
                  <div className="flex flex-col items-center pt-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${dotColor} ring-2 ring-[#070b1a]`} />
                    {i < Math.min(todaysClasses.length, 4) - 1 && <div className="flex-1 w-px bg-white/10 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="font-bold text-sm truncate">{c.subjects?.name || "Class"}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.room ? `Room ${c.room}` : "Classroom"} • {c.teachers?.name || "Teacher"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full self-center ${statusColor}`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-4 gap-2.5">
        <StatCard label="Attendance" value={`${attendanceRate}%`} subtitle="This Month" color="text-emerald-300" icon="📊" />
        <StatCard label="Assignments" value={pendingHw} subtitle="Pending" color="text-amber-300" icon="📝" />
        <StatCard label="Exams" value={examsThisWeek} subtitle="This Week" color="text-rose-300" icon="🎯" />
        <StatCard label="Fees Due" value={`₹${totalDue}`} subtitle="Pay Now" color="text-pink-300" icon="💳" small />
      </section>
    </div>
  );
}

function StatCard({ label, value, subtitle, color, icon, small }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 min-w-0">
      <p className="text-[10px] text-slate-400 truncate">{label}</p>
      <div className="flex items-end justify-between mt-1 gap-1">
        <p className={`font-extrabold ${color} truncate ${small ? "text-sm" : "text-lg"}`}>{value}</p>
        <span className="text-base shrink-0">{icon}</span>
      </div>
      <p className="text-[9px] text-slate-500 truncate mt-0.5">{subtitle}</p>
    </div>
  );
}
