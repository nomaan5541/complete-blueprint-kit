import { useStudentData } from "@/hooks/useStudentData";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, ClipboardCheck, FileText, BookOpen, TrendingUp, Award } from "lucide-react";
import { StudentPanel } from "@/components/student/StudentUI";

export default function StudentActivity() {
  const { student, marks, homeworkList, attempts, presentDays, totalDays, attendanceRate } = useStudentData();
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (!student?.id) return;
    (async () => {
      const { count } = await supabase
        .from("student_chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("student_id", student.id)
        .eq("role", "user");
      setChatCount(count || 0);
    })();
  }, [student]);

  const att = parseFloat(attendanceRate as any) || 0;
  const examScore = marks.length === 0 ? 0 : Math.min(100, (marks.reduce((s: number, m: any) => s + (m.max_marks > 0 ? (Number(m.marks_obtained || 0) / Number(m.max_marks)) * 100 : 0), 0) / marks.length));
  const engagement = Math.min(100, (chatCount * 5) + (attempts.length * 10) + (homeworkList.length * 2));
  const usageScore = Math.round(att * 0.4 + examScore * 0.35 + engagement * 0.25);

  const tier = usageScore >= 80 ? { label: "Excellent", color: "hsl(var(--student-green))" }
            : usageScore >= 60 ? { label: "Good", color: "hsl(var(--student-blue))" }
            : usageScore >= 40 ? { label: "Average", color: "hsl(var(--student-amber))" }
            : { label: "Needs Focus", color: "hsl(var(--student-rose))" };

  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (usageScore / 100) * circ;

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--student-surface-2))" strokeWidth="10" />
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                stroke={tier.color}
                strokeDasharray={`${dash} ${circ}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold leading-none">{usageScore}</span>
              <span className="text-[10px] student-muted-text mt-1">/ 100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider student-muted-text font-bold">AI Usage Score</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: tier.color }}>{tier.label}</p>
            <p className="text-xs student-muted-text mt-2 leading-relaxed">Based on attendance, exam performance, and app engagement.</p>
          </div>
        </div>
      </StudentPanel>

      <section>
        <h2 className="text-base font-extrabold mb-3 px-1">How you're using the app</h2>
        <div className="space-y-2.5">
          <Row icon={ClipboardCheck} tone="student-tone-green" label="Attendance" value={`${att.toFixed(0)}%`} sub={`${presentDays}/${totalDays} days present`} />
          <Row icon={FileText} tone="student-tone-violet" label="Exam Performance" value={`${examScore.toFixed(0)}%`} sub={`${marks.length} graded entries`} />
          <Row icon={MessageCircle} tone="student-tone-blue" label="AI Assistant Use" value={`${chatCount}`} sub="messages sent" />
          <Row icon={BookOpen} tone="student-tone-amber" label="Online Exams Taken" value={`${attempts.length}`} sub="attempts" />
          <Row icon={ClipboardCheck} tone="student-tone-rose" label="Active Homework" value={`${homeworkList.length}`} sub="assigned" />
        </div>
      </section>

      <StudentPanel className="p-4 flex gap-3 bg-[linear-gradient(135deg,hsl(var(--student-primary)/0.18),hsl(var(--student-blue)/0.14))] border-[hsl(var(--student-primary)/0.32)]">
        <span className="student-mini-icon student-tone-violet h-10 w-10 shrink-0">
          {usageScore >= 80 ? <Award className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
        </span>
        <div>
          <p className="font-extrabold text-sm">{usageScore >= 80 ? "Keep it up!" : "Tip to improve"}</p>
          <p className="text-xs student-muted-text mt-1 leading-relaxed">
            {usageScore >= 80 ? "You're using the app effectively. Stay consistent." :
             att < 75 ? "Improve your attendance — it has the biggest impact on your score." :
             examScore < 60 ? "Review past exams in Results to boost performance." :
             "Try the AI Assistant when you're stuck — it counts toward engagement."}
          </p>
        </div>
      </StudentPanel>
    </div>
  );
}

function Row({ icon: Icon, tone, label, value, sub }: any) {
  return (
    <StudentPanel className="p-4 flex items-center gap-3">
      <span className={`student-mini-icon ${tone} h-10 w-10`}><Icon className="h-5 w-5" /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{label}</p>
        <p className="text-[11px] student-muted-text truncate mt-0.5">{sub}</p>
      </div>
      <p className="text-base font-extrabold whitespace-nowrap">{value}</p>
    </StudentPanel>
  );
}
