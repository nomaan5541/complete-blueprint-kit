import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Mail, Phone, MapPin, Droplet, Users, Camera, LogOut, Pencil } from "lucide-react";
import { format } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { student, loading } = useStudentData();

  if (loading) return <div className="pt-4 h-72 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const rows = [
    { icon: Calendar, label: "Date of Birth", value: student.date_of_birth ? format(new Date(student.date_of_birth), "dd MMM yyyy") : "—", tone: "student-tone-violet" },
    { icon: Mail, label: "Email", value: student.parent_email || "—", tone: "student-tone-blue" },
    { icon: Phone, label: "Phone", value: student.phone || student.parent_phone || "—", tone: "student-tone-green" },
    { icon: MapPin, label: "Address", value: student.address || "—", tone: "student-tone-amber" },
    { icon: Droplet, label: "Blood Group", value: student.blood_group || "—", tone: "student-tone-rose" },
    { icon: Users, label: "Parent / Guardian", value: student.parent_name ? `${student.parent_name}${student.parent_phone ? `\n+91 ${student.parent_phone}` : ""}` : "—", tone: "student-tone-cyan" },
  ];

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-6 text-center">
        <div className="relative inline-block">
          <Avatar className="h-24 w-24 ring-4 ring-[hsl(var(--student-green)/0.5)] mx-auto shadow-[0_18px_38px_hsl(var(--student-blue)/0.3)]">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback className="bg-[hsl(var(--student-primary)/0.32)] text-[hsl(var(--student-foreground))] text-3xl font-extrabold">{student.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[hsl(var(--student-primary))] ring-2 ring-[hsl(var(--student-bg))] flex items-center justify-center active:scale-90 transition">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-2xl font-extrabold mt-4">{student.name}</h2>
        <p className="text-sm student-muted-text mt-1">
          Class {student.classes?.name || "—"}
          {student.roll_number ? ` • Roll No. ${student.roll_number}` : ""}
        </p>
        <p className="text-xs student-muted-text mt-1">Student ID: {student.admission_number}</p>
      </StudentPanel>

      <StudentPanel className="divide-y divide-[hsl(var(--student-border)/0.55)] overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="px-4 py-3.5 flex items-start gap-3">
            <span className={`student-mini-icon ${r.tone}`}><r.icon className="h-4 w-4" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] student-muted-text font-semibold">{r.label}</p>
              <p className="text-sm font-bold whitespace-pre-line mt-0.5">{r.value}</p>
            </div>
          </div>
        ))}
      </StudentPanel>

      <button className="w-full py-3.5 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-violet)))] font-extrabold text-sm text-[hsl(var(--student-foreground))] shadow-[0_12px_30px_hsl(var(--student-primary)/0.4)] active:scale-[0.99] transition flex items-center justify-center gap-2">
        <Pencil className="h-4 w-4" /> Edit Profile
      </button>

      <button
        onClick={signOut}
        className="w-full py-3.5 rounded-2xl bg-[hsl(var(--student-rose)/0.12)] border border-[hsl(var(--student-rose)/0.3)] font-bold text-sm text-[hsl(var(--student-rose))] flex items-center justify-center gap-2 active:scale-[0.99] transition"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}
