import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { User, Building2, FileText, Trophy, Wallet, Settings, HelpCircle, Shield, Info, LogOut, ChevronRight, Bus, BookOpen, CalendarDays } from "lucide-react";
import { StudentPanel } from "@/components/student/StudentUI";

export default function StudentMore() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const items = [
    { icon: User, title: "My Profile", to: "/student/profile" }, { icon: Building2, title: "My School", to: "/student/school", active: true },
    { icon: FileText, title: "Report Card", to: "/student/results" }, { icon: Trophy, title: "Achievements", to: "/student/activity" },
    { icon: Wallet, title: "Wallet", to: "/student/fees" }, { icon: BookOpen, title: "Library", to: "/student/library" },
    { icon: CalendarDays, title: "Events", to: "/student/events" }, { icon: Bus, title: "Transport", to: "/student/transport" },
    { icon: Settings, title: "Settings", to: "/student/profile" }, { icon: HelpCircle, title: "Help & Support", to: "/contact" },
    { icon: Shield, title: "Privacy Policy", to: "/privacy" }, { icon: Info, title: "About App", to: "/about" },
  ];
  return <div className="space-y-3 pb-6 pt-2 animate-fade-in"><StudentPanel className="divide-y divide-[hsl(var(--student-border)/0.55)] overflow-hidden">{items.map((it) => <button key={it.title} onClick={() => navigate(it.to)} className={`w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-[hsl(var(--student-surface-2)/0.75)] transition ${it.active ? "bg-[hsl(var(--student-primary)/0.12)]" : ""}`}><span className={`student-mini-icon ${it.active ? "student-tone-violet" : "student-tone-blue"}`}><it.icon className="h-5 w-5" /></span><span className={`flex-1 text-sm font-bold ${it.active ? "text-[hsl(var(--student-primary))]" : ""}`}>{it.title}</span><ChevronRight className="h-4 w-4 student-muted-text" /></button>)}<button onClick={signOut} className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-[hsl(var(--student-surface-2)/0.75)] transition"><span className="student-mini-icon student-tone-rose"><LogOut className="h-5 w-5" /></span><span className="flex-1 text-sm font-bold text-[hsl(var(--student-rose))]">Logout</span><ChevronRight className="h-4 w-4 student-muted-text" /></button></StudentPanel></div>;
}
