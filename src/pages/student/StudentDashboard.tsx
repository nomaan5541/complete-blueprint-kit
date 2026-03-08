import { useNavigate } from "react-router-dom";
import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ClipboardCheck, FileText, IndianRupee, Bell, Calendar, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { student, attendance, marks, fees, notifications, homeworkList, loading, attendanceRate, totalDue, presentDays, totalDays, onlineExams, attempts } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md"><CardContent className="pt-6 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No student record found</p>
        <p className="text-sm text-muted-foreground mt-2">Your account is not linked to a student record yet. Please contact your school admin.</p>
      </CardContent></Card>
    </div>
  );

  const upcomingExams = onlineExams.filter((e: any) => e.status === "published" && !attempts.find((a: any) => a.exam_id === e.id && a.status === "completed"));
  const recentResults = marks.slice(0, 3);
  const upcomingHomework = homeworkList.filter((h: any) => new Date(h.due_date) >= new Date()).slice(0, 3);
  const recentNotices = notifications.slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {student.name}</h1>
        <p className="text-muted-foreground text-sm">
          {student.classes?.name} {student.sections?.name ? `- Section ${student.sections.name}` : ""} · {student.academic_years?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/student/attendance")}>
          <CardContent className="pt-4 text-center">
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 text-emerald-500" />
            <p className="text-xl sm:text-2xl font-bold">{attendanceRate}%</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Attendance ({presentDays}/{totalDays})</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/student/results")}>
          <CardContent className="pt-4 text-center">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 text-primary" />
            <p className="text-xl sm:text-2xl font-bold">{marks.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Exam Records</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/student/fees")}>
          <CardContent className="pt-4 text-center">
            <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 text-amber-500" />
            <p className="text-xl sm:text-2xl font-bold">₹{totalDue.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Fee Due</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/student/notifications")}>
          <CardContent className="pt-4 text-center">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 text-blue-500" />
            <p className="text-xl sm:text-2xl font-bold">{notifications.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Notices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming Exams</CardTitle></CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No upcoming exams</p>
            ) : (
              <div className="space-y-2">
                {upcomingExams.slice(0, 3).map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.subjects?.name} · {exam.total_marks} marks</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{exam.duration_minutes} min</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Results</CardTitle></CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No results yet</p>
            ) : (
              <div className="space-y-2">
                {recentResults.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{m.exams?.name}</p>
                      <p className="text-xs text-muted-foreground">{m.subjects?.name}</p>
                    </div>
                    <Badge variant="outline">{m.marks_obtained}/{m.max_marks}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Homework */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Pending Homework</CardTitle></CardHeader>
          <CardContent>
            {upcomingHomework.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No pending homework</p>
            ) : (
              <div className="space-y-2">
                {upcomingHomework.map((hw: any) => (
                  <div key={hw.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{hw.title}</p>
                      <p className="text-xs text-muted-foreground">{hw.subjects?.name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(hw.due_date), "dd MMM")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Announcements</CardTitle></CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No announcements</p>
            ) : (
              <div className="space-y-2">
                {recentNotices.map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{n.type}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd MMM")}</span>
                    </div>
                    <p className="font-medium text-sm">{n.title}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
