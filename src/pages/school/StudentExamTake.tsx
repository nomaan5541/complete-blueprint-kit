import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function StudentExamTake() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const examId = params.get("examId");

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load exam data
  useEffect(() => {
    if (!examId || !user) return;
    async function load() {
      // Get student record
      const { data: stud } = await supabase.from("students")
        .select("id").eq("user_id", user!.id).eq("status", "active").maybeSingle();
      if (!stud) { toast.error("No student record found"); setLoading(false); return; }
      setStudent(stud);

      // Get exam
      const { data: examData } = await supabase.from("exams")
        .select("*, subjects(name), classes(name)").eq("id", examId).single();
      if (!examData) { toast.error("Exam not found"); setLoading(false); return; }
      setExam(examData);

      // Check for existing attempt
      const { data: existingAttempt } = await supabase.from("student_exam_attempts" as any)
        .select("*").eq("exam_id", examId).eq("student_id", stud.id).maybeSingle();

      if (existingAttempt && (existingAttempt as any).status === "completed") {
        // Show results
        await loadResult(stud.id, (existingAttempt as any).id);
        setLoading(false);
        return;
      }

      // Load questions with options
      const { data: qData } = await supabase.from("exam_questions" as any)
        .select("*, exam_options(*)").eq("exam_id", examId).order("order_number");
      
      // Shuffle questions and options for anti-cheat
      const shuffled = shuffleArray(qData || []).map((q: any) => ({
        ...q, exam_options: shuffleArray(q.exam_options || []),
      }));
      setQuestions(shuffled);

      if (existingAttempt) {
        setAttempt(existingAttempt);
        // Load existing answers
        const { data: ansData } = await supabase.from("student_answers" as any)
          .select("*").eq("attempt_id", (existingAttempt as any).id);
        const ansMap: Record<string, string> = {};
        (ansData || []).forEach((a: any) => { ansMap[a.question_id] = a.selected_option_id; });
        setAnswers(ansMap);
        // Calculate remaining time
        const elapsed = (Date.now() - new Date((existingAttempt as any).start_time).getTime()) / 1000;
        const duration = ((examData as any).duration_minutes || 60) * 60;
        setTimeLeft(Math.max(0, Math.floor(duration - elapsed)));
      } else {
        setTimeLeft(((examData as any).duration_minutes || 60) * 60);
      }
      setLoading(false);
    }
    load();
  }, [examId, user]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft > 0 && !result]);

  // Anti-cheat: disable context menu and copy
  useEffect(() => {
    const preventCopy = (e: Event) => { e.preventDefault(); toast.error("Copy/paste disabled during exam"); };
    const preventContext = (e: Event) => { e.preventDefault(); };
    document.addEventListener("copy", preventCopy);
    document.addEventListener("contextmenu", preventContext);
    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("contextmenu", preventContext);
    };
  }, []);

  const shuffleArray = (arr: any[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startExam = async () => {
    if (!student || !examId) return;
    const { data, error } = await supabase.from("student_exam_attempts" as any).insert({
      exam_id: examId, student_id: student.id,
      start_time: new Date().toISOString(), status: "in_progress",
    } as any).select().single();
    if (error) { toast.error(error.message); return; }
    setAttempt(data);
  };

  const selectOption = async (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (!attempt) return;
    // Save answer
    await supabase.from("student_answers" as any).upsert({
      attempt_id: (attempt as any).id,
      question_id: questionId,
      selected_option_id: optionId,
    } as any, { onConflict: "attempt_id,question_id" } as any);
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    if (!autoSubmit && !confirm("Are you sure you want to submit? You cannot change answers after submission.")) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Calculate score
      let totalScore = 0;
      for (const q of questions) {
        const selectedOptionId = answers[q.id];
        const correctOption = q.exam_options?.find((o: any) => o.is_correct);
        const isCorrect = selectedOptionId === correctOption?.id;
        if (isCorrect) totalScore += Number(q.marks);

        // Update answer record
        if (selectedOptionId) {
          await supabase.from("student_answers" as any).upsert({
            attempt_id: (attempt as any).id,
            question_id: q.id,
            selected_option_id: selectedOptionId,
            is_correct: isCorrect,
            marks_awarded: isCorrect ? q.marks : 0,
          } as any, { onConflict: "attempt_id,question_id" } as any);
        }
      }

      // Update attempt
      await supabase.from("student_exam_attempts" as any).update({
        end_time: new Date().toISOString(),
        score: totalScore,
        status: "completed",
      } as any).eq("id", (attempt as any).id);

      // Also insert into exam_marks for unified reporting
      if (exam?.subject_id && exam?.class_id) {
        const totalMax = questions.reduce((s: number, q: any) => s + Number(q.marks), 0);
        await supabase.from("exam_marks").upsert({
          school_id: exam.school_id,
          exam_id: exam.id,
          student_id: student.id,
          subject_id: exam.subject_id,
          class_id: exam.class_id,
          marks_obtained: totalScore,
          max_marks: totalMax,
        } as any, { onConflict: "exam_id,student_id,subject_id" });
      }

      await loadResult(student.id, (attempt as any).id);
      toast.success(autoSubmit ? "Time's up! Exam auto-submitted" : "Exam submitted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  }, [questions, answers, attempt, student, exam, submitting]);

  const loadResult = async (studentId: string, attemptId: string) => {
    const { data: attemptData } = await supabase.from("student_exam_attempts" as any)
      .select("*").eq("id", attemptId).single();
    const { data: ansData } = await supabase.from("student_answers" as any)
      .select("*, exam_questions(*), exam_options(*)").eq("attempt_id", attemptId);
    
    const totalQ = (ansData || []).length;
    const correct = (ansData || []).filter((a: any) => a.is_correct).length;
    setResult({
      attempt: attemptData,
      answers: ansData || [],
      totalQuestions: totalQ,
      correct, wrong: totalQ - correct,
      score: (attemptData as any)?.score || 0,
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!exam) return <div className="text-center py-20 text-muted-foreground">Exam not found</div>;

  // RESULT VIEW
  if (result) {
    const totalMax = questions.length > 0
      ? questions.reduce((s: number, q: any) => s + Number(q.marks), 0)
      : result.answers.reduce((s: number, a: any) => s + Number(a.exam_questions?.marks || 0), 0);
    const pct = totalMax > 0 ? (result.score / totalMax) * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              {pct >= 50 ? <CheckCircle2 className="h-12 w-12 text-success" /> : <XCircle className="h-12 w-12 text-destructive" />}
            </div>
            <CardTitle className="text-2xl">Exam Completed!</CardTitle>
            <p className="text-muted-foreground">{exam.name} · {(exam as any).subjects?.name}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-primary/5 border">
                <p className="text-3xl font-bold text-primary">{result.score}/{totalMax}</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border">
                <p className="text-3xl font-bold text-primary">{pct.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Percentage</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success px-3 py-1">✓ Correct: {result.correct}</Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive px-3 py-1">✗ Wrong: {result.wrong}</Badge>
              <Badge variant="outline" className="px-3 py-1">Unanswered: {questions.length - result.totalQuestions}</Badge>
            </div>
            <Button className="w-full" onClick={() => navigate("/student")}>Back to Portal</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // INSTRUCTIONS VIEW (before starting)
  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{exam.name}</CardTitle>
            <p className="text-muted-foreground">{(exam as any).subjects?.name} · {(exam as any).classes?.name}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-3 rounded-lg border">
                <p className="font-bold">{questions.length}</p><p className="text-muted-foreground">Questions</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-bold">{(exam as any).total_marks}</p><p className="text-muted-foreground">Total Marks</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="font-bold">{(exam as any).duration_minutes} min</p><p className="text-muted-foreground">Duration</p>
              </div>
            </div>

            {(exam as any).instructions && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="font-semibold text-sm mb-2">Instructions:</p>
                <p className="text-sm whitespace-pre-line">{(exam as any).instructions}</p>
              </div>
            )}

            <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Important:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 mt-1">
                  <li>Do not refresh the page during exam</li>
                  <li>Exam will auto-submit when time expires</li>
                  <li>Copy-paste is disabled</li>
                  <li>Each question has only one correct answer</li>
                </ul>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={startExam}>Start Exam</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // EXAM TAKING VIEW
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isUrgent = timeLeft < 120;

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4 select-none" onCopy={e => e.preventDefault()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card sticky top-0 z-10">
        <div>
          <p className="font-semibold text-sm">{exam.name}</p>
          <p className="text-xs text-muted-foreground">Q {currentQ + 1} / {questions.length}</p>
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${isUrgent ? "text-destructive animate-pulse" : "text-foreground"}`}>
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question */}
      {q && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Question {currentQ + 1}</Badge>
              <Badge variant="outline">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base font-medium leading-relaxed">{q.question_text}</p>
            
            {q.image_url && (
              <div className="flex justify-center">
                <img src={q.image_url} alt="Question" className="max-h-48 rounded-lg border object-contain" />
              </div>
            )}

            <div className="space-y-2">
              {(q.exam_options || []).map((opt: any, i: number) => {
                const isSelected = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => selectOption(q.id, opt.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{opt.option_text}</p>
                      {opt.option_image && (
                        <img src={opt.option_image} alt="Option" className="mt-2 max-h-24 rounded border object-contain" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        
        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                i === currentQ ? "bg-primary text-primary-foreground" :
                answers[questions[i]?.id] ? "bg-success/20 text-success border border-success/30" :
                "bg-muted text-muted-foreground"
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {currentQ < questions.length - 1 ? (
          <Button onClick={() => setCurrentQ(p => p + 1)}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => handleSubmit(false)} disabled={submitting} variant="destructive">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Exam
          </Button>
        )}
      </div>
    </div>
  );
}
