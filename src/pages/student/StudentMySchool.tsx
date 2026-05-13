import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { GraduationCap, Info, MessageCircle, Eye, Image as ImageIcon, Phone, ChevronRight } from "lucide-react";
import { StudentPanel } from "@/components/student/StudentUI";

export default function StudentMySchool() {
  const navigate = useNavigate();
  const { school, loading } = useStudentData();
  if (loading) return <div className="pt-4 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />)}</div>;
  const items = [
    { icon: Info, title: "About School", sub: "Learn more about our school", tone: "student-tone-blue" }, { icon: MessageCircle, title: "Principal's Message", sub: "Read the message", tone: "student-tone-violet" },
    { icon: Eye, title: "Vision & Mission", sub: "Our goals and values", tone: "student-tone-green" }, { icon: ImageIcon, title: "School Gallery", sub: "Explore school memories", tone: "student-tone-pink" },
    { icon: Phone, title: "Contact Us", sub: "Get in touch with us", tone: "student-tone-amber", to: "/contact" },
  ];
  return <div className="space-y-5 pb-6 pt-2 animate-fade-in"><StudentPanel className="p-5 flex items-center gap-4"><div className="student-icon-frame student-tone-green h-16 w-16"><GraduationCap className="h-9 w-9" /></div><div className="min-w-0"><p className="font-extrabold text-xl sm:text-3xl truncate">{school?.name || "Your School"}</p><p className="student-muted-text text-sm mt-1">Est. {school?.created_at ? new Date(school.created_at).getFullYear() : "—"}</p></div></StudentPanel><div className="space-y-3">{items.map((it) => <button key={it.title} onClick={() => it.to && navigate(it.to)} className="w-full student-panel p-4 flex items-center gap-3 active:scale-[0.99] transition text-left"><div className={`student-mini-icon ${it.tone}`}><it.icon className="h-5 w-5" /></div><div className="flex-1 min-w-0"><p className="font-bold text-sm">{it.title}</p><p className="text-xs student-muted-text truncate mt-0.5">{it.sub}</p></div><ChevronRight className="h-5 w-5 student-muted-text" /></button>)}</div></div>;
}
