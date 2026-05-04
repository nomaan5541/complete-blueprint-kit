import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  User, Building2, FileText, Trophy, Wallet, Settings, HelpCircle,
  Shield, Info, LogOut, ChevronRight,
} from "lucide-react";

export default function StudentMore() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const items = [
    { icon: User, title: "My Profile", to: "/student/profile" },
    { icon: Building2, title: "My School", to: "/student/school", active: true },
    { icon: FileText, title: "Report Card", to: "/student/results" },
    { icon: Trophy, title: "Achievements", to: "/student/activity" },
    { icon: Wallet, title: "Wallet", to: "/student/fees" },
    { icon: Settings, title: "Settings", to: "/student/profile" },
    { icon: HelpCircle, title: "Help & Support", to: "/contact" },
    { icon: Shield, title: "Privacy Policy", to: "/privacy" },
    { icon: Info, title: "About App", to: "/about" },
  ];

  return (
    <div className="space-y-2 pb-6 pt-2">
      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
        {items.map((it) => (
          <button
            key={it.title}
            onClick={() => navigate(it.to)}
            className={`w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-white/5 transition ${
              it.active ? "bg-indigo-500/15" : ""
            }`}
          >
            <it.icon className={`h-5 w-5 ${it.active ? "text-indigo-300" : "text-slate-300"}`} />
            <span className={`flex-1 text-sm font-semibold ${it.active ? "text-indigo-300" : ""}`}>{it.title}</span>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        ))}

        <button
          onClick={signOut}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-white/5 transition"
        >
          <LogOut className="h-5 w-5 text-rose-400" />
          <span className="flex-1 text-sm font-semibold text-rose-400">Logout</span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
