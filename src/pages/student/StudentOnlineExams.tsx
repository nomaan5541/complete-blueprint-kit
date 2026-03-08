import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function StudentOnlineExams() {
  const navigate = useNavigate();
  const { student, onlineExams, attempts, loading } = useStudentData();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No student record found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact your school admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publishedExams = onlineExams.filter(
    (e: any) => e.exam_mode === "online" && e.status === "published"
  );

  const getAttempt = (examId: string) =>
    attempts.find((a: any) => a.exam_id === examId);

  const upcoming = publishedExams.filter(
    (e: any) => !getAttempt(e.id) || getAttempt(e.id)?.status !== "completed"
  );
  const completed = publishedExams.filter(
    (e: any) => getAttempt(e.id)?.status === "completed"
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Online Exams</h1>
        <p className="text-sm text-muted-foreground">
          Take online exams assigned to your class
        </p>
      </div>

      {/* Available Exams */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Available Exams
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No online exams available right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((exam: any) => {
              const att = getAttempt(exam.id);
              const inProgress = att && att.status === "in_progress";
              return (
                <Card key={exam.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold line-clamp-2">
                      {exam.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {exam.subjects?.name && <p>Subject: {exam.subjects.name}</p>}
                      {exam.total_marks && <p>Total Marks: {exam.total_marks}</p>}
                      {exam.duration_minutes && (
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.duration_minutes} minutes
                        </p>
                      )}
                      {exam.exam_date && (
                        <p>Date: {format(new Date(exam.exam_date), "dd MMM yyyy")}</p>
                      )}
                    </div>
                    <div className="mt-auto">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/student/exam-take?examId=${exam.id}`)}
                      >
                        {inProgress ? "Resume Exam" : "Start Exam"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Exams */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed Exams
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((exam: any) => {
              const att = getAttempt(exam.id);
              return (
                <Card key={exam.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold line-clamp-2">
                      {exam.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {exam.subjects?.name && <p>Subject: {exam.subjects.name}</p>}
                      {att?.score !== null && att?.score !== undefined && (
                        <p className="text-sm font-medium text-foreground">
                          Score: {att.score}/{exam.total_marks}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
