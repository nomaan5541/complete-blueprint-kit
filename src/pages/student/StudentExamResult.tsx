import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft, Loader2 } from "lucide-react";

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
      setAttempt(att);
      setExam((att as any).exams);

      const { data: qs } = await supabase
        .from("exam_questions")
        .select("*, exam_options(*)")
        .eq("exam_id", (att as any).exam_id)
        .order("order_number");

      const { data: ans } = await supabase
        .from("student_answers")
        .select("*")
        .eq("attempt_id", attemptId);

      const ansMap: Record<string, any> = {};
      (ans || []).forEach((a: any) => { ansMap[a.question_id] = a; });

      const merged = (qs || []).map((q: any) => ({
        ...q,
        student_answer: ansMap[q.id] || null,
      }));
      setQuestions(merged);
      setLoading(false);
    })();
  }, [attemptId, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!attempt) return <div className="text-center py-20 text-muted-foreground">Result not found</div>;

  const totalMax = questions.reduce((s, q) => s + Number(q.marks || 0), 0);
  const correct = questions.filter(q => q.student_answer?.is_correct).length;
  const wrong = questions.filter(q => q.student_answer && q.student_answer.selected_option_id && !q.student_answer.is_correct).length;
  const unanswered = questions.length - correct - wrong;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{exam?.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {exam?.subjects?.name} · {exam?.classes?.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-lg bg-primary/5 border">
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {Number(attempt.score || 0)}/{totalMax}
              </p>
              <p className="text-[11px] text-muted-foreground">Score</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 border">
              <p className="text-xl sm:text-2xl font-bold text-success">{correct}</p>
              <p className="text-[11px] text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/5 border">
              <p className="text-xl sm:text-2xl font-bold text-destructive">{wrong}</p>
              <p className="text-[11px] text-muted-foreground">Wrong</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border">
              <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{unanswered}</p>
              <p className="text-[11px] text-muted-foreground">Skipped</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-question review */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold px-1">Question Review</h2>
        {questions.map((q, idx) => {
          const sa = q.student_answer;
          const correctOpt = q.exam_options?.find((o: any) => o.is_correct);
          const status = !sa?.selected_option_id
            ? "skipped"
            : sa.is_correct ? "correct" : "wrong";

          return (
            <Card key={q.id} className={
              status === "correct" ? "border-success/30" :
              status === "wrong" ? "border-destructive/30" :
              "border-muted"
            }>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Q{idx + 1}</Badge>
                    {status === "correct" && <Badge className="bg-success/15 text-success text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</Badge>}
                    {status === "wrong" && <Badge className="bg-destructive/15 text-destructive text-xs"><XCircle className="h-3 w-3 mr-1" /> Wrong</Badge>}
                    {status === "skipped" && <Badge variant="outline" className="text-xs"><MinusCircle className="h-3 w-3 mr-1" /> Skipped</Badge>}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Number(sa?.marks_awarded || 0)}/{q.marks}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{q.question_text}</p>
                {q.image_url && (
                  <img src={q.image_url} alt="" className="max-h-40 rounded border object-contain" />
                )}
                <div className="space-y-1.5 pt-1">
                  {q.exam_options?.map((opt: any, i: number) => {
                    const isPicked = sa?.selected_option_id === opt.id;
                    const isCorrect = opt.is_correct;
                    return (
                      <div key={opt.id} className={`p-2 rounded-md border text-sm flex items-start gap-2 ${
                        isCorrect ? "border-success/40 bg-success/5" :
                        isPicked && !isCorrect ? "border-destructive/40 bg-destructive/5" :
                        "border-border"
                      }`}>
                        <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                          isCorrect ? "bg-success text-success-foreground" :
                          isPicked ? "bg-destructive text-destructive-foreground" :
                          "bg-muted"
                        }`}>{String.fromCharCode(65 + i)}</span>
                        <div className="flex-1">
                          <p>{opt.option_text}</p>
                          <div className="flex gap-1.5 mt-0.5">
                            {isPicked && <span className="text-[10px] text-muted-foreground">Your answer</span>}
                            {isCorrect && <span className="text-[10px] text-success">Correct answer</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {status === "skipped" && correctOpt && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Correct answer: <span className="font-medium text-foreground">{correctOpt.option_text}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
