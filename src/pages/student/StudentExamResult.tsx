import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft, Loader2 } from "lucide-react";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentExamResult() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const attemptId = params.get("attemptId");

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!attemptId || !user) return;
    (async () => {
      const { data: att } = await supabase
        .from("student_exam_attempts")
        .select("*, exams(*, subjects(name), classes(name))")
        .eq("id", attemptId)
        .maybeSingle();
      if (!att) { setLoading(false); return; }
      setAttempt(att); setExam((att as any).exams);

      const { data: qs } = await supabase
        .from("exam_questions")
        .select("*, exam_options(*)")
        .eq("exam_id", (att as any).exam_id)
        .order("order_number");
      const { data: ans } = await supabase
        .from("student_answers").select("*").eq("attempt_id", attemptId);

      const ansMap: Record<string, any> = {};
      (ans || []).forEach((a: any) => { ansMap[a.question_id] = a; });
      setQuestions((qs || []).map((q: any) => ({ ...q, student_answer: ansMap[q.id] || null })));
      setLoading(false);
    })();
  }, [attemptId, user]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin student-muted-text" /></div>;
  if (!attempt) return <StudentEmpty title="Result not found" />;

  const totalMax = questions.reduce((s, q) => s + Number(q.marks || 0), 0);
  const correct = questions.filter((q) => q.student_answer?.is_correct).length;
  const wrong = questions.filter((q) => q.student_answer && q.student_answer.selected_option_id && !q.student_answer.is_correct).length;
  const unanswered = questions.length - correct - wrong;

  return (
    <div className="space-y-4 pb-6 pt-2 animate-fade-in">
      <button onClick={() => navigate(-1)} className="text-xs font-bold text-[hsl(var(--student-primary))] inline-flex items-center gap-1 active:scale-95 transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <StudentPanel className="p-5 space-y-4">
        <div>
          <p className="font-extrabold text-base">{exam?.name}</p>
          <p className="text-xs student-muted-text mt-1">{exam?.subjects?.name} · {exam?.classes?.name}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <Stat tone="violet" value={`${Number(attempt.score || 0)}/${totalMax}`} label="Score" />
          <Stat tone="green" value={correct} label="Correct" />
          <Stat tone="rose" value={wrong} label="Wrong" />
          <Stat tone="amber" value={unanswered} label="Skipped" />
        </div>
      </StudentPanel>

      <h2 className="text-base font-extrabold mt-2 px-1">Question Review</h2>
      {questions.map((q, idx) => {
        const sa = q.student_answer;
        const status = !sa?.selected_option_id ? "skipped" : sa.is_correct ? "correct" : "wrong";
        const correctOpt = q.exam_options?.find((o: any) => o.is_correct);
        const statusChip = status === "correct"
          ? "bg-[hsl(var(--student-green)/0.16)] text-[hsl(var(--student-green))]"
          : status === "wrong"
          ? "bg-[hsl(var(--student-rose)/0.16)] text-[hsl(var(--student-rose))]"
          : "bg-[hsl(var(--student-surface-2)/0.7)] student-muted-text";
        const Icon = status === "correct" ? CheckCircle2 : status === "wrong" ? XCircle : MinusCircle;

        return (
          <StudentPanel key={q.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[hsl(var(--student-surface-2)/0.7)]">Q{idx + 1}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusChip}`}>
                  <Icon className="h-3 w-3" /> {status === "correct" ? "Correct" : status === "wrong" ? "Wrong" : "Skipped"}
                </span>
              </div>
              <span className="text-[11px] font-bold student-muted-text">{Number(sa?.marks_awarded || 0)}/{q.marks}</span>
            </div>
            <p className="text-sm font-bold leading-relaxed">{q.question_text}</p>
            {q.image_url && <img src={q.image_url} alt="" className="max-h-40 rounded-xl border border-[hsl(var(--student-border)/0.6)] object-contain" />}
            <div className="space-y-1.5">
              {q.exam_options?.map((opt: any, i: number) => {
                const isPicked = sa?.selected_option_id === opt.id;
                const isCorrect = opt.is_correct;
                const cls = isCorrect
                  ? "border-[hsl(var(--student-green)/0.45)] bg-[hsl(var(--student-green)/0.08)]"
                  : isPicked
                  ? "border-[hsl(var(--student-rose)/0.45)] bg-[hsl(var(--student-rose)/0.08)]"
                  : "border-[hsl(var(--student-border)/0.6)] bg-[hsl(var(--student-surface-2)/0.4)]";
                const letter = isCorrect
                  ? "bg-[hsl(var(--student-green))] text-[hsl(var(--student-bg))]"
                  : isPicked
                  ? "bg-[hsl(var(--student-rose))] text-[hsl(var(--student-foreground))]"
                  : "bg-[hsl(var(--student-surface-2)/0.8)]";
                return (
                  <div key={opt.id} className={`p-2.5 rounded-2xl border text-sm flex items-start gap-2.5 ${cls}`}>
                    <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${letter}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[hsl(var(--student-foreground))]">{opt.option_text}</p>
                      <div className="flex gap-2 mt-1">
                        {isPicked && <span className="text-[10px] student-muted-text">Your answer</span>}
                        {isCorrect && <span className="text-[10px] text-[hsl(var(--student-green))] font-bold">Correct answer</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {status === "skipped" && correctOpt && (
              <p className="text-xs student-muted-text">
                Correct answer: <span className="font-bold text-[hsl(var(--student-foreground))]">{correctOpt.option_text}</span>
              </p>
            )}
          </StudentPanel>
        );
      })}
    </div>
  );
}

function Stat({ tone, value, label }: { tone: string; value: string | number; label: string }) {
  const map: Record<string, string> = {
    violet: "bg-[hsl(var(--student-violet)/0.12)] text-[hsl(var(--student-violet))]",
    green: "bg-[hsl(var(--student-green)/0.12)] text-[hsl(var(--student-green))]",
    rose: "bg-[hsl(var(--student-rose)/0.12)] text-[hsl(var(--student-rose))]",
    amber: "bg-[hsl(var(--student-amber)/0.12)] text-[hsl(var(--student-amber))]",
  };
  return (
    <div className={`rounded-2xl border border-[hsl(var(--student-border)/0.6)] p-3 ${map[tone]}`}>
      <p className="text-xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[10px] font-bold mt-0.5 opacity-90">{label}</p>
    </div>
  );
}
