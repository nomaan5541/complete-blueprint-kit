import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar, Mail, Phone, MapPin, Droplet, Users, Camera, LogOut,
} from "lucide-react";
import { format } from "date-fns";

export default function StudentProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { student, school, loading } = useStudentData();

  if (loading) return <div className="pt-4 h-72 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  const rows = [
    { icon: Calendar, label: "Date of Birth", value: student.date_of_birth ? format(new Date(student.date_of_birth), "dd MMM yyyy") : "—" },
    { icon: Mail, label: "Email", value: student.parent_email || "—" },
    { icon: Phone, label: "Phone", value: student.phone || student.parent_phone || "—" },
    { icon: MapPin, label: "Address", value: student.address || "—" },
    { icon: Droplet, label: "Blood Group", value: student.blood_group || "—" },
    { icon: Users, label: "Parent / Guardian", value: student.parent_name ? `${student.parent_name}${student.parent_phone ? `\n+91 ${student.parent_phone}` : ""}` : "—" },
  ];

  return (
    <div className="space-y-4 pb-6 pt-2">
      {/* Profile Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center relative">
        <div className="relative inline-block">
          <Avatar className="h-24 w-24 ring-4 ring-emerald-400/30 mx-auto">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback className="bg-indigo-500/30 text-white text-3xl font-bold">{student.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-indigo-500 ring-2 ring-[#0f1530] flex items-center justify-center">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <h2 className="text-xl font-extrabold mt-3">{student.name}</h2>
        <p className="text-sm text-slate-300 mt-0.5">
          Class {student.classes?.name || "—"}
          {student.roll_number ? ` • Roll No. ${student.roll_number}` : ""}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Student ID: {student.admission_number}</p>
      </div>

      {/* Info rows */}
      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="px-4 py-3.5 flex items-start gap-3">
            <r.icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-400">{r.label}</p>
              <p className="text-sm font-semibold whitespace-pre-line">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-sm shadow-[0_8px_24px_rgba(99,102,241,0.4)] active:scale-[0.99] transition">
        Edit Profile
      </button>

      <button
        onClick={signOut}
        className="w-full py-3.5 rounded-2xl bg-rose-500/10 border border-rose-400/20 font-semibold text-sm text-rose-300 flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}
