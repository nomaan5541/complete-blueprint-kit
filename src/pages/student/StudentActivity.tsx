import { useStudentData } from "@/hooks/useStudentData";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Activity, MessageCircle, ClipboardCheck, FileText, BookOpen, TrendingUp, Award } from "lucide-react";

export default function StudentActivity() {
  const { user } = useAuth();
  const { student, attendance, marks, homeworkList, attempts, presentDays, totalDays, attendanceRate } = useStudentData();
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

  // Usage score (0-100): weighted blend
  const att = parseFloat(attendanceRate as any) || 0;
  const examScore = marks.length === 0 ? 0 : Math.min(100, (marks.reduce((s: number, m: any) => s + (m.max_marks > 0 ? (Number(m.marks_obtained || 0) / Number(m.max_marks)) * 100 : 0), 0) / marks.length));
  const engagement = Math.min(100, (chatCount * 5) + (attempts.length * 10) + (homeworkList.length * 2));
  const usageScore = Math.round(att * 0.4 + examScore * 0.35 + engagement * 0.25);

  const tier = usageScore >= 80 ? { label: "Excellent", color: "text-emerald-600", ring: "stroke-emerald-500" }
            : usageScore >= 60 ? { label: "Good", color: "text-blue-600", ring: "stroke-blue-500" }
            : usageScore >= 40 ? { label: "Average", color: "text-amber-600", ring: "stroke-amber-500" }
            : { label: "Needs Focus", color: "text-rose-600", ring: "stroke-rose-500" };

  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (usageScore / 100) * circ;

  return (
    <div className="space-y-5 pb-6">
      {/* AI Score */}
      <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                className={tier.ring}
                strokeDasharray={`${dash} ${circ}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold leading-none">{usageScore}</span>
              <span className="text-[10px] text-muted-foreground mt-1">/ 100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">AI Usage Score</p>
            <p className={`text-xl font-extrabold mt-1 ${tier.color}`}>{tier.label}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Based on attendance, exam performance, and app engagement.</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <section>
        <h2 className="text-base font-bold mb-3 px-1">How you're using the app</h2>
        <div className="space-y-2.5">
          <Row icon={ClipboardCheck} bg="bg-emerald-100" fg="text-emerald-600" label="Attendance" value={`${att.toFixed(0)}%`} sub={`${presentDays}/${totalDays} days present`} />
          <Row icon={FileText} bg="bg-violet-100" fg="text-violet-600" label="Exam Performance" value={`${examScore.toFixed(0)}%`} sub={`${marks.length} graded entries`} />
          <Row icon={MessageCircle} bg="bg-blue-100" fg="text-blue-600" label="AI Assistant Use" value={`${chatCount}`} sub="messages sent" />
          <Row icon={BookOpen} bg="bg-orange-100" fg="text-orange-600" label="Online Exams Taken" value={`${attempts.length}`} sub="attempts" />
          <Row icon={ClipboardCheck} bg="bg-rose-100" fg="text-rose-600" label="Active Homework" value={`${homeworkList.length}`} sub="assigned" />
        </div>
      </section>

      {/* Tip */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-2xl p-4 flex gap-3 border border-indigo-100 dark:border-indigo-500/20">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-card flex items-center justify-center">
          {usageScore >= 80 ? <Award className="h-5 w-5 text-emerald-600" /> : <TrendingUp className="h-5 w-5 text-indigo-600" />}
        </div>
        <div>
          <p className="font-bold text-sm">{usageScore >= 80 ? "Keep it up!" : "Tip to improve"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {usageScore >= 80 ? "You're using the app effectively. Stay consistent." :
             att < 75 ? "Improve your attendance — it has the biggest impact on your score." :
             examScore < 60 ? "Review past exams in Results to boost performance." :
             "Try the AI Assistant when you're stuck — it counts toward engagement."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, bg, fg, label, value, sub }: any) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center gap-3">
      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${bg} dark:bg-opacity-15`}>
        <Icon className={`h-5 w-5 ${fg}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
      </div>
      <p className="text-base font-extrabold whitespace-nowrap">{value}</p>
    </div>
  );
}
