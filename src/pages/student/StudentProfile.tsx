import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldCheck, Mail, Phone, ChevronRight, User, KeyRound, AtSign, Shield, Link2,
  Bell, Globe, Sun, Database, Lock, BookOpen, FileText, FolderOpen, ClipboardCheck, Award,
  HelpCircle, MessageSquare, FileCheck, ScrollText, Info, LogOut
} from "lucide-react";

type Row = { icon: any; title: string; sub?: string; right?: string; to?: string; onClick?: () => void };

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { student, school, marks, attendance, attendanceRate, loading } = useStudentData();

  if (loading) return <div className="bg-white dark:bg-card rounded-2xl p-6 mt-2 animate-pulse h-40" />;
  if (!student) return <div className="bg-white dark:bg-card rounded-2xl p-6 text-center mt-2">No student record</div>;

  const examsCompleted = marks.length;
  const attendanceMonthRate = attendanceRate;

  const account: Row[] = [
    { icon: User, title: "Personal Information", sub: "Update your personal details" },
    { icon: KeyRound, title: "Change Password", sub: "Update your account password" },
    { icon: AtSign, title: "Email & Phone", sub: "Manage your email and phone number" },
    { icon: Shield, title: "Security Settings", sub: "Two-factor authentication, login activity" },
    { icon: Link2, title: "Linked Accounts", sub: "Manage third-party linked accounts" },
  ];
  const app: Row[] = [
    { icon: Bell, title: "Notifications", sub: "Manage your notification preferences", to: "/student/notifications" },
    { icon: Globe, title: "App Language", sub: "Change app language", right: "English" },
    { icon: Sun, title: "Theme", sub: "Choose app theme", right: "Light" },
    { icon: Database, title: "Data & Storage", sub: "Manage app data and storage usage" },
    { icon: Lock, title: "Privacy Settings", sub: "Manage your privacy and data permissions" },
  ];
  const academics: Row[] = [
    { icon: BookOpen, title: "My Subjects", sub: "View subjects and syllabus", to: "/student/my-class" },
    { icon: FileText, title: "Exam History", sub: "View all your exam history and results", to: "/student/results" },
    { icon: FolderOpen, title: "Study Materials", sub: "Download history and saved materials", to: "/student/materials" },
    { icon: ClipboardCheck, title: "Attendance History", sub: "View your attendance records", to: "/student/attendance" },
    { icon: Award, title: "Achievements", sub: "View all your badges and achievements" },
  ];
  const support: Row[] = [
    { icon: HelpCircle, title: "Help & Support", sub: "Get help and contact support team" },
    { icon: MessageSquare, title: "Feedback", sub: "Share your feedback with us" },
    { icon: FileCheck, title: "Terms & Conditions", sub: "Read our terms and conditions", to: "/terms" },
    { icon: ScrollText, title: "Privacy Policy", sub: "Read our privacy policy", to: "/privacy" },
    { icon: Info, title: "About App", sub: "App version 2.1.0" },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Profile card */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col items-center sm:items-start gap-2 sm:w-32 shrink-0">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-blue-50">
                <AvatarImage src={student.photo_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">{student.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1 rounded-full">
              <ShieldCheck className="h-3 w-3" /> Verified Student
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold leading-tight truncate">{student.name}</h2>
            <p className="text-sm text-muted-foreground">Class {student.classes?.name}{student.sections?.name ? ` - ${student.sections.name}` : ""}</p>
            <p className="text-xs text-muted-foreground mt-1">Student ID: {student.admission_number}</p>
            <div className="mt-3 space-y-1">
              {student.parent_email && <p className="text-xs flex items-center gap-1.5 text-muted-foreground truncate"><Mail className="h-3 w-3" /> {student.parent_email}</p>}
              {student.phone && <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" /> {student.phone}</p>}
            </div>
          </div>
        </div>

        {/* Account status mini-table */}
        <div className="mx-4 mb-4 bg-blue-50/60 dark:bg-blue-500/10 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">Account Status</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-white dark:bg-card px-2 py-0.5 rounded-full">Active</span>
          </div>
          <Field label="Academic Year" value={student.academic_years?.name} />
          <Field label="School" value={school?.name} />
          <Field label="Joined On" value={student.admission_date} />
        </div>

        <button
          onClick={() => {/* edit profile placeholder */}}
          className="w-full px-4 py-3 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-300 active:bg-muted transition"
        >
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> View & Edit Profile</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MiniStat icon={BookOpen} bg="bg-emerald-100" fg="text-emerald-600" value={`${attendanceMonthRate}%`} label="Attendance" />
        <MiniStat icon={FileText} bg="bg-violet-100" fg="text-violet-600" value={examsCompleted} label="Exams Completed" />
        <MiniStat icon={Award} bg="bg-amber-100" fg="text-amber-600" value={attendance.length > 0 ? `${attendance.filter((a:any)=>a.status==='present').length}` : "—"} label="Present Days" />
        <MiniStat icon={ShieldCheck} bg="bg-blue-100" fg="text-blue-600" value={student.status === "active" ? "Active" : student.status} label="Status" />
      </div>

      <Section title="Account Settings" icon={User} rows={account} navigate={navigate} />
      <Section title="App Settings" icon={Sun} rows={app} navigate={navigate} />
      <Section title="Academics" icon={BookOpen} rows={academics} navigate={navigate} />
      <Section title="Support & Legal" icon={HelpCircle} rows={support} navigate={navigate} />

      <button
        onClick={signOut}
        className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
      >
        <div className="h-10 w-10 rounded-xl bg-white dark:bg-card flex items-center justify-center"><LogOut className="h-5 w-5 text-rose-600" /></div>
        <div>
          <p className="font-bold text-sm text-rose-600">Logout</p>
          <p className="text-xs text-muted-foreground">Sign out from your account</p>
        </div>
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold truncate ml-2 max-w-[60%] text-right">{value || "—"}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, bg, fg, value, label }: any) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center gap-2.5 min-w-0">
      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${bg} dark:bg-opacity-15`}>
        <Icon className={`h-5 w-5 ${fg}`} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-tight truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, rows, navigate }: { title: string; icon: any; rows: Row[]; navigate: any }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        </div>
        <p className="font-bold text-sm">{title}</p>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <button
            key={r.title}
            onClick={() => r.onClick ? r.onClick() : r.to && navigate(r.to)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-muted transition"
          >
            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
              <r.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{r.title}</p>
              {r.sub && <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>}
            </div>
            {r.right && <span className="text-xs text-muted-foreground mr-1">{r.right}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
