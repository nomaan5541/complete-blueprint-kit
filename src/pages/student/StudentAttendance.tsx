import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function StudentAttendancePage() {
  const { student, attendance, loading, presentDays, totalDays, attendanceRate } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  const absentDays = attendance.filter(a => a.status === "absent").length;
  const leaveDays = attendance.filter(a => a.status === "leave").length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
          <p className="text-xs text-muted-foreground">Overall Attendance</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{presentDays}</p>
          <p className="text-xs text-muted-foreground">Present Days</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-destructive">{absentDays}</p>
          <p className="text-xs text-muted-foreground">Absent Days</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{leaveDays}</p>
          <p className="text-xs text-muted-foreground">Leave Days</p>
        </CardContent></Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader><CardTitle>Attendance Record (Last 60 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">P = Present</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">A = Absent</Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">L = Leave</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {attendance.map((a) => (
              <div key={a.id} title={`${format(new Date(a.date), "dd MMM yyyy")}: ${a.status}`}
                className={`w-8 h-8 rounded-md text-xs flex items-center justify-center font-medium cursor-default ${
                  a.status === "present" ? "bg-emerald-500/20 text-emerald-600" : 
                  a.status === "absent" ? "bg-destructive/20 text-destructive" : 
                  "bg-amber-500/20 text-amber-600"
                }`}>
                {a.status[0].toUpperCase()}
              </div>
            ))}
          </div>

          {/* Date-wise list */}
          {attendance.length > 0 && (
            <div className="mt-6 space-y-1 max-h-60 overflow-y-auto">
              {attendance.filter(a => a.status !== "present").map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm border-b">
                  <span>{format(new Date(a.date), "dd MMM yyyy, EEEE")}</span>
                  <Badge variant={a.status === "absent" ? "destructive" : "secondary"} className="text-xs capitalize">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
