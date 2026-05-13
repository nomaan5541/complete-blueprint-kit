import { ReactNode, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Building2, Calendar, MessageSquare, Grid3x3, Bell, Menu, ChevronLeft } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/student", icon: Home, label: "Home", end: true },
  { to: "/student/school", icon: Building2, label: "My Schools" },
  { to: "/student/calendar", icon: Calendar, label: "Calendar" },
  { to: "/student/messages", icon: MessageSquare, label: "Messages", badge: true },
  { to: "/student/more", icon: Grid3x3, label: "More" },
];

const PAGE_META: Record<string, { title?: string; showBack?: boolean; showMenu?: boolean }> = {
  "/student": { showMenu: true },
  "/student/school": { title: "My School", showBack: true },
  "/student/calendar": { title: "Calendar", showMenu: true },
  "/student/messages": { title: "Messages", showMenu: true },
  "/student/more": { title: "More", showMenu: true },
  "/student/profile": { title: "My Profile", showBack: true },
  "/student/attendance": { title: "Attendance", showBack: true },
  "/student/results": { title: "Exam Results", showBack: true },
  "/student/exam": { title: "Online Exams", showBack: true },
  "/student/fees": { title: "Fees", showBack: true },
  "/student/timetable": { title: "Timetable", showBack: true },
  "/student/homework": { title: "Homework", showBack: true },
  "/student/notifications": { title: "Notifications", showBack: true },
  "/student/materials": { title: "Study Materials", showBack: true },
  "/student/library": { title: "Library", showBack: true },
  "/student/events": { title: "Events", showBack: true },
  "/student/transport": { title: "Transport", showBack: true },
  "/student/id-card": { title: "ID Card", showBack: true },
  "/student/meetings": { title: "Meetings", showBack: true },
  "/student/chat": { title: "AI Assistant", showBack: true },
  "/student/my-class": { title: "My Class", showBack: true },
  "/student/activity": { title: "Achievements", showBack: true },
};

export function StudentLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, notifications } = useStudentData();
  const meta = PAGE_META[location.pathname] || { showBack: true };
  const isHome = location.pathname === "/student";
  const unread = notifications?.length || 0;

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => { if (!hadDark) root.classList.remove("dark"); };
  }, []);

  return (
    <div className="student-app min-h-screen w-full text-[hsl(var(--student-foreground))] pb-[106px] relative overflow-x-hidden">
      <header className="relative z-20 pt-[env(safe-area-inset-top)]">
        <div className="px-5 sm:px-8 pt-4 sm:pt-6 pb-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {meta.showBack && !isHome ? (
              <button
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="student-header-button -ml-1"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <button
                aria-label="Menu"
                onClick={() => navigate("/student/more")}
                className="student-header-button -ml-1"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            <div className="flex-1 min-w-0">
              {!isHome && meta.title && (
                <h1 className="text-lg sm:text-2xl font-extrabold leading-tight truncate">{meta.title}</h1>
              )}
            </div>

            <button
              onClick={() => navigate("/student/notifications")}
              aria-label="Notifications"
              className="student-header-button relative shrink-0"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[hsl(var(--student-danger))] text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[hsl(var(--student-bg))]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/student/profile")}
              aria-label="Profile"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden ring-2 ring-[hsl(var(--student-green))] shrink-0 relative shadow-[0_10px_26px_hsl(var(--student-blue)/0.18)]"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={student?.photo_url || undefined} alt={student?.name || "Student"} />
                <AvatarFallback className="bg-[hsl(var(--student-primary)/0.28)] text-[hsl(var(--student-foreground))] text-sm font-extrabold">
                  {student?.name?.charAt(0)?.toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[hsl(var(--student-green))] ring-2 ring-[hsl(var(--student-bg))]" />
            </button>
          </div>

          {isHome && (
            <div className="pt-3 sm:pt-5">
              <p className="student-muted-text text-base">Good {greeting()},</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold mt-0.5 leading-tight">
                {student?.name?.split(" ").slice(0, 2).join(" ") || "Student"} <span>👋</span>
              </h1>
            </div>
          )}
        </div>
      </header>

      <main className="px-5 sm:px-8 max-w-7xl mx-auto relative z-10">
        {children}
      </main>

      <nav
        className="student-bottom-nav fixed bottom-3 left-3 right-3 z-40 max-w-4xl mx-auto pb-[env(safe-area-inset-bottom)]"
        aria-label="Student navigation"
      >
        <div className="grid grid-cols-5 h-[72px] px-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold transition relative rounded-2xl",
                  isActive ? "text-[hsl(var(--student-primary))]" : "text-[hsl(var(--student-muted))] hover:text-[hsl(var(--student-foreground))]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <t.icon className={cn("h-[23px] w-[23px] sm:h-6 sm:w-6", isActive && "drop-shadow-[0_0_10px_hsl(var(--student-primary)/0.8)]")} strokeWidth={isActive ? 2.5 : 1.8} />
                    {t.badge && unread > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[hsl(var(--student-danger))] text-[hsl(var(--student-foreground))] text-[10px] font-extrabold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <span className="leading-none truncate max-w-full">{t.label}</span>
                  {isActive && <span className="absolute bottom-2 h-1 w-6 rounded-full bg-[hsl(var(--student-primary))]" />}
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
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
