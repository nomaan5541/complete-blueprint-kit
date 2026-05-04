import { ReactNode, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Building2, Calendar, MessageSquare, Grid3x3, Bell, Menu, ChevronLeft } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/student", icon: Home, label: "Home", end: true },
  { to: "/student/school", icon: Building2, label: "My School" },
  { to: "/student/calendar", icon: Calendar, label: "Calendar" },
  { to: "/student/messages", icon: MessageSquare, label: "Messages", badge: true },
  { to: "/student/more", icon: Grid3x3, label: "More" },
];

const PAGE_META: Record<string, { title?: string; subtitle?: string; showBack?: boolean; showMenu?: boolean }> = {
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
  "/student/id-card": { title: "ID Card", showBack: true },
  "/student/meetings": { title: "Live Classes", showBack: true },
  "/student/chat": { title: "AI Assistant", showBack: true },
  "/student/my-class": { title: "My Class", showBack: true },
  "/student/activity": { title: "Activity", showBack: true },
};

export function StudentLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { student, notifications } = useStudentData();
  const meta = PAGE_META[location.pathname] || { showBack: true };
  const isHome = location.pathname === "/student";
  const unread = notifications?.length || 0;

  // Force dark color scheme on student portal to match the design mockups
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => { if (!hadDark) root.classList.remove("dark"); };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#070b1a] text-slate-100 pb-[88px] relative overflow-x-hidden">
      {/* Subtle ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-40 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Top header bar */}
      <header className="relative z-10 pt-[env(safe-area-inset-top)]">
        <div className="px-5 pt-5 pb-3 max-w-3xl mx-auto flex items-center gap-3">
          {meta.showBack && !isHome ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="h-10 w-10 -ml-1 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              aria-label="Menu"
              onClick={() => navigate("/student/more")}
              className="h-10 w-10 -ml-1 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-95 transition"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {!isHome && meta.title && (
              <h1 className="text-lg font-bold leading-tight truncate">{meta.title}</h1>
            )}
          </div>

          <button
            onClick={() => navigate("/student/notifications")}
            aria-label="Notifications"
            className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-95 transition shrink-0"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-[#070b1a]">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/student/profile")}
            aria-label="Profile"
            className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-emerald-400/40 shrink-0 relative"
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={student?.photo_url || undefined} alt={student?.name} />
              <AvatarFallback className="bg-indigo-500/30 text-white text-sm font-semibold">
                {student?.name?.charAt(0)?.toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070b1a]" />
          </button>
        </div>

        {isHome && (
          <div className="px-5 max-w-3xl mx-auto pb-2">
            <p className="text-sm text-slate-400">Good {greeting()},</p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">
              {student?.name?.split(" ").slice(0, 2).join(" ") || "Student"} <span>👋</span>
            </h1>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-5 max-w-3xl mx-auto relative z-10">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-3 inset-x-3 z-40 max-w-3xl mx-auto rounded-3xl bg-[#0f1530]/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5 h-[68px] px-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition relative",
                  isActive ? "text-indigo-400" : "text-slate-400"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <t.icon className={cn("h-[22px] w-[22px]", isActive && "drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]")} strokeWidth={isActive ? 2.4 : 1.8} />
                    {t.badge && unread > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <span className="leading-none">{t.label}</span>
                  {isActive && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-indigo-400" />}
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
