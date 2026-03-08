import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)"];

export default function TeacherAnalytics() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(id, name), subjects(id, name)")
        .eq("teacher_id", t.id);
      setAssignments(assigns || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  useEffect(() => {
    if (!selectedClass || !teacher) return;
    async function fetchAnalytics() {
      const [sRes, mRes, aRes] = await Promise.all([
        supabase.from("students").select("id, name, admission_number").eq("school_id", teacher.school_id).eq("class_id", selectedClass).eq("status", "active").order("name"),
        supabase.from("exam_marks").select("*, subjects(name), exams(name)").eq("class_id", selectedClass).eq("school_id", teacher.school_id),
        supabase.from("attendance").select("student_id, status").eq("class_id", selectedClass).eq("school_id", teacher.school_id),
      ]);
      setStudents(sRes.data || []);
      setMarks(mRes.data || []);
      setAttendance(aRes.data || []);
    }
    fetchAnalytics();
  }, [selectedClass, teacher]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher profile found</div>;

  // Compute analytics
  const studentPerformance = students.map(s => {
    const studentMarks = marks.filter(m => m.student_id === s.id);
    const totalObtained = studentMarks.reduce((sum, m) => sum + Number(m.marks_obtained || 0), 0);
    const totalMax = studentMarks.reduce((sum, m) => sum + Number(m.max_marks || 0), 0);
    const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    const studentAtt = attendance.filter(a => a.student_id === s.id);
    const present = studentAtt.filter(a => a.status === "present").length;
    const attPct = studentAtt.length > 0 ? (present / studentAtt.length) * 100 : 0;

    return { ...s, pct: Math.round(pct * 10) / 10, attPct: Math.round(attPct * 10) / 10, totalExams: studentMarks.length };
  }).sort((a, b) => b.pct - a.pct);

  const avgScore = studentPerformance.length > 0
    ? Math.round(studentPerformance.reduce((s, p) => s + p.pct, 0) / studentPerformance.length * 10) / 10
    : 0;
  const avgAtt = studentPerformance.length > 0
    ? Math.round(studentPerformance.reduce((s, p) => s + p.attPct, 0) / studentPerformance.length * 10) / 10
    : 0;

  // Subject-wise average
  const subjectMap: Record<string, { total: number; max: number; name: string }> = {};
  marks.forEach(m => {
    const subName = m.subjects?.name || "Unknown";
    if (!subjectMap[subName]) subjectMap[subName] = { total: 0, max: 0, name: subName };
    subjectMap[subName].total += Number(m.marks_obtained || 0);
    subjectMap[subName].max += Number(m.max_marks || 0);
  });
  const subjectData = Object.values(subjectMap).map(s => ({
    name: s.name, avg: s.max > 0 ? Math.round((s.total / s.max) * 100) : 0,
  }));

  // Grade distribution
  const gradeDistribution = [
    { name: "A (≥80%)", value: studentPerformance.filter(s => s.pct >= 80).length },
    { name: "B (60-79%)", value: studentPerformance.filter(s => s.pct >= 60 && s.pct < 80).length },
    { name: "C (40-59%)", value: studentPerformance.filter(s => s.pct >= 40 && s.pct < 60).length },
    { name: "D (<40%)", value: studentPerformance.filter(s => s.pct < 40 && s.pct > 0).length },
    { name: "No Data", value: studentPerformance.filter(s => s.pct === 0).length },
  ].filter(g => g.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground">Class-wise academic performance overview</p>
      </div>

      <div className="space-y-1">
        <Label>Select Class</Label>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{students.length}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{avgAtt}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{marks.length}</p>
              <p className="text-xs text-muted-foreground">Total Mark Entries</p>
            </CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject-wise Average */}
            {subjectData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Subject-wise Average (%)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Grade Distribution */}
            {gradeDistribution.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Grade Distribution</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {gradeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Student Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Performance Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Score %</TableHead>
                    <TableHead className="text-right">Attendance %</TableHead>
                    <TableHead className="text-right">Exams</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPerformance.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.admission_number}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.pct >= 60 ? "default" : s.pct >= 40 ? "secondary" : "destructive"}>{s.pct}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.attPct}%</TableCell>
                      <TableCell className="text-right">{s.totalExams}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
