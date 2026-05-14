import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { Monitor, Clock, CheckCircle2, BookOpen, Play } from "lucide-react";
import { format } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentOnlineExams() {
  const navigate = useNavigate();
  const { student, onlineExams, attempts, loading } = useStudentData();

  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty icon={Monitor} title="No student record found" text="Please contact your school admin." />;

  const publishedExams = onlineExams.filter((e: any) => e.exam_mode === "online" && e.status === "published");
  const getAttempt = (examId: string) => attempts.find((a: any) => a.exam_id === examId);
  const upcoming = publishedExams.filter((e: any) => !getAttempt(e.id) || getAttempt(e.id)?.status !== "completed");
  const completed = publishedExams.filter((e: any) => getAttempt(e.id)?.status === "completed");

  return (
    <div className="space-y-6 pb-6 pt-2 animate-fade-in">
      <section>
        <h2 className="text-base font-extrabold mb-3 px-1 flex items-center gap-2">
          <span className="student-mini-icon student-tone-blue"><BookOpen className="h-4 w-4" /></span>
          Available Exams
        </h2>
        {upcoming.length === 0 ? (
          <StudentEmpty icon={Monitor} title="No exams available" text="When your teacher publishes a new online exam, it will appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((exam: any) => {
              const att = getAttempt(exam.id);
              const inProgress = att?.status === "in_progress";
              return (
                <StudentPanel key={exam.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-sm leading-snug line-clamp-2">{exam.name}</p>
                    {inProgress && <span className="student-chip text-[10px] shrink-0">In progress</span>}
                  </div>
                  <div className="space-y-1 text-xs student-muted-text">
                    {exam.subjects?.name && <p>Subject: <span className="text-[hsl(var(--student-foreground))] font-semibold">{exam.subjects.name}</span></p>}
                    {exam.total_marks && <p>Total marks: <span className="text-[hsl(var(--student-foreground))] font-semibold">{exam.total_marks}</span></p>}
                    {exam.duration_minutes && <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration_minutes} minutes</p>}
                    {exam.exam_date && <p>Date: {format(new Date(exam.exam_date), "dd MMM yyyy")}</p>}
                  </div>
                  <button
                    onClick={() => navigate(`/student/exam-take?examId=${exam.id}`)}
                    className="mt-auto inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] text-sm font-extrabold text-[hsl(var(--student-foreground))] shadow-[0_8px_22px_hsl(var(--student-primary)/0.4)] active:scale-[0.99] transition"
                  >
                    <Play className="h-4 w-4" /> {inProgress ? "Resume Exam" : "Start Exam"}
                  </button>
                </StudentPanel>
              );
            })}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="text-base font-extrabold mb-3 px-1 flex items-center gap-2">
            <span className="student-mini-icon student-tone-green"><CheckCircle2 className="h-4 w-4" /></span>
            Completed Exams
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((exam: any) => {
              const att = getAttempt(exam.id);
              return (
                <StudentPanel key={exam.id} className="p-4 space-y-2">
                  <p className="font-extrabold text-sm leading-snug line-clamp-2">{exam.name}</p>
                  <div className="text-xs student-muted-text space-y-1">
                    {exam.subjects?.name && <p>Subject: <span className="text-[hsl(var(--student-foreground))] font-semibold">{exam.subjects.name}</span></p>}
                    {att?.score !== null && att?.score !== undefined && (
                      <p className="text-base font-extrabold text-[hsl(var(--student-foreground))]">
                        {att.score}<span className="text-xs student-muted-text">/{exam.total_marks}</span>
                      </p>
                    )}
                  </div>
                  {att?.id && (
                    <button
                      onClick={() => navigate(`/student/exam-result?attemptId=${att.id}`)}
                      className="w-full mt-1 py-2 rounded-2xl bg-[hsl(var(--student-surface-2)/0.7)] border border-[hsl(var(--student-border)/0.6)] text-xs font-bold active:scale-[0.99] transition"
                    >
                      View Result
                    </button>
                  )}
                </StudentPanel>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
