import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, GraduationCap, Activity, Calendar, User, Bell, ChevronLeft } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/student", icon: Home, label: "Home", end: true },
  { to: "/student/my-class", icon: GraduationCap, label: "My Class" },
  { to: "/student/activity", icon: Activity, label: "Activity" },
  { to: "/student/calendar", icon: Calendar, label: "Calendar" },
  { to: "/student/profile", icon: User, label: "Profile" },
];

const PAGE_META: Record<string, { title: string; subtitle?: string; showBack?: boolean }> = {
  "/student": { title: "", subtitle: "" }, // dashboard has its own header
  "/student/my-class": { title: "My Class", subtitle: "", showBack: true },
  "/student/activity": { title: "Activity", subtitle: "Your learning insights", showBack: true },
  "/student/calendar": { title: "Calendar", subtitle: "Schedule & holidays", showBack: true },
  "/student/profile": { title: "Profile", subtitle: "Manage your account and app preferences" },
  "/student/attendance": { title: "Attendance", subtitle: "Your attendance history", showBack: true },
  "/student/results": { title: "Results", subtitle: "Exam results", showBack: true },
  "/student/exam": { title: "Online Exams", subtitle: "Available exams", showBack: true },
  "/student/fees": { title: "Fee Details", subtitle: "Payments & dues", showBack: true },
  "/student/timetable": { title: "Time Table", subtitle: "Weekly schedule", showBack: true },
  "/student/homework": { title: "Assignments", subtitle: "Your homework", showBack: true },
  "/student/notifications": { title: "Notifications", subtitle: "Alerts & announcements", showBack: true },
  "/student/materials": { title: "Study Material", subtitle: "Notes, PDFs & videos", showBack: true },
  "/student/id-card": { title: "ID Card", subtitle: "Your school ID", showBack: true },
  "/student/meetings": { title: "Live Classes", subtitle: "Join meetings", showBack: true },
  "/student/chat": { title: "Ask Doubt", subtitle: "AI Assistant", showBack: true },
};

export function StudentLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, notifications } = useStudentData();
  const meta = PAGE_META[location.pathname] || { title: "", showBack: true };
  const isHome = location.pathname === "/student";
  const unread = notifications?.length || 0;

  return (
    <div className="min-h-screen w-full bg-[hsl(220,20%,97%)] dark:bg-background pb-[76px]">
      {/* Gradient header — present on every student page */}
      <header className="relative bg-gradient-to-br from-[#3730a3] via-[#4338ca] to-[#4f46e5] text-white pt-[env(safe-area-inset-top)]">
        <div className="px-4 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            {meta.showBack && !isHome && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="h-9 w-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              {isHome ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">
                    Good {greeting()}, {student?.name?.split(" ")[0] || "Student"} <span className="inline-block">👋</span>
                  </h1>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5">Have a great day at school!</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">{meta.title}</h1>
                  {meta.subtitle && <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">{meta.subtitle}</p>}
                </>
              )}
            </div>
            <button
              onClick={() => navigate("/student/notifications")}
              aria-label="Notifications"
              className="relative h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition shrink-0"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#4338ca]" />
              )}
            </button>
            <button
              onClick={() => navigate("/student/profile")}
              aria-label="Profile"
              className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/30 shrink-0"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={student?.photo_url || undefined} alt={student?.name} />
                <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                  {student?.name?.charAt(0)?.toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* Content with overlap to header for card-on-gradient look */}
      <main className="px-4 sm:px-6 max-w-3xl mx-auto -mt-6 sm:-mt-8 relative z-10">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-card border-t border-border/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
        aria-label="Primary"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-5 h-[60px]">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:scale-95 transition-transform",
                  isActive ? "text-[#4338ca] dark:text-indigo-400" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className={cn("h-[22px] w-[22px]", isActive && "fill-[#4338ca]/10 dark:fill-indigo-400/10")} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className="leading-none">{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
