import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Monitor, Eye } from "lucide-react";
import { format } from "date-fns";

export default function TeacherExamMonitor() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: exams } = await supabase.from("exams")
        .select("*, classes(name), subjects(name)")
        .eq("school_id", t.school_id)
        .eq("exam_mode", "online")
        .order("created_at", { ascending: false });
      setOnlineExams(exams || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  useEffect(() => {
    if (!selectedExam) return;
    async function fetchAttempts() {
      const { data } = await supabase.from("student_exam_attempts" as any)
        .select("*, students(name, admission_number)")
        .eq("exam_id", selectedExam)
        .order("created_at", { ascending: false });
      setAttempts((data as any[]) || []);
    }
    fetchAttempts();
  }, [selectedExam]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher profile found</div>;

  const selectedExamData = onlineExams.find(e => e.id === selectedExam);
  const completedAttempts = attempts.filter((a: any) => a.status === "completed");
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((s: number, a: any) => s + Number(a.score || 0), 0) / completedAttempts.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Online Exam Monitor</h1>
        <p className="text-muted-foreground">Track student attempts and scores for online exams</p>
      </div>

      <div className="space-y-1">
        <Label>Select Online Exam</Label>
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select exam" /></SelectTrigger>
          <SelectContent>
            {onlineExams.length === 0 ? (
              <SelectItem value="none" disabled>No online exams found</SelectItem>
            ) : (
              onlineExams.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} — {(e as any).classes?.name} · {(e as any).subjects?.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedExam && (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{attempts.length}</p>
              <p className="text-xs text-muted-foreground">Total Attempts</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{completedAttempts.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{attempts.filter((a: any) => a.status === "in_progress").length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent></Card>
          </div>

          {/* Attempts Table */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Student Attempts</CardTitle></CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attempts yet for this exam</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((a: any, i: number) => (
                      <TableRow key={a.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium">{a.students?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{a.students?.admission_number}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === "completed" ? "default" : a.status === "in_progress" ? "secondary" : "outline"}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {a.status === "completed" ? `${a.score}/${selectedExamData?.total_marks || "—"}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.start_time ? format(new Date(a.start_time), "dd MMM hh:mm a") : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.end_time ? format(new Date(a.end_time), "dd MMM hh:mm a") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
