import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { GraduationCap, Info, MessageCircle, Eye, Image as ImageIcon, Phone, ChevronRight } from "lucide-react";

export default function StudentMySchool() {
  const navigate = useNavigate();
  const { school, student, loading } = useStudentData();

  if (loading) return <div className="pt-4 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}</div>;

  const items = [
    { icon: Info, title: "About School", sub: "Learn more about our school", color: "bg-blue-500/20 text-blue-300" },
    { icon: MessageCircle, title: "Principal's Message", sub: "Read the message", color: "bg-violet-500/20 text-violet-300" },
    { icon: Eye, title: "Vision & Mission", sub: "Our goals and values", color: "bg-emerald-500/20 text-emerald-300" },
    { icon: ImageIcon, title: "School Gallery", sub: "Explore school memories", color: "bg-fuchsia-500/20 text-fuchsia-300" },
    { icon: Phone, title: "Contact Us", sub: "Get in touch with us", color: "bg-amber-500/20 text-amber-300", to: "/contact" },
  ];

  return (
    <div className="space-y-4 pb-6 pt-2">
      <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
          <GraduationCap className="h-7 w-7 text-emerald-300" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-lg truncate">{school?.name || "Your School"}</p>
          <p className="text-xs text-slate-300 mt-0.5">Est. {school?.created_at ? new Date(school.created_at).getFullYear() : "—"}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {items.map((it) => (
          <button
            key={it.title}
            onClick={() => it.to && navigate(it.to)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition text-left"
          >
            <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${it.color}`}>
              <it.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{it.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{it.sub}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
