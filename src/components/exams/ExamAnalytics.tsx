import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Award } from "lucide-react";

const COLORS = ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export default function ExamAnalytics() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId || !selectedYearId) return;
    Promise.all([
      supabase.from("exams").select("*").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
    ]).then(([eRes, cRes]) => {
      setExams(eRes.data || []);
      setClasses(cRes.data || []);
    });
  }, [schoolId, selectedYearId]);

  useEffect(() => {
    if (!selectedExamId || !selectedClassId) { setMarks([]); return; }
    setLoading(true);
    supabase.from("exam_marks").select("*, students(name, admission_number), subjects(name)")
      .eq("exam_id", selectedExamId).eq("class_id", selectedClassId)
      .then(({ data }) => { setMarks(data || []); setLoading(false); });
  }, [selectedExamId, selectedClassId]);

  // Analytics calculations
  const studentMap: Record<string, { name: string; total: number; max: number }> = {};
  marks.forEach((m: any) => {
    if (!studentMap[m.student_id]) studentMap[m.student_id] = { name: m.students?.name || "", total: 0, max: 0 };
    studentMap[m.student_id].total += Number(m.marks_obtained) || 0;
    studentMap[m.student_id].max += Number(m.max_marks) || 0;
  });

  const students = Object.values(studentMap);
  const percentages = students.map(s => s.max > 0 ? (s.total / s.max) * 100 : 0);
  const avgScore = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
  const highest = percentages.length > 0 ? Math.max(...percentages) : 0;
  const lowest = percentages.length > 0 ? Math.min(...percentages) : 0;
  const passCount = percentages.filter(p => p >= 40).length;
  const passRate = percentages.length > 0 ? (passCount / percentages.length) * 100 : 0;

  // Subject-wise average
  const subjectMap: Record<string, { name: string; total: number; max: number; count: number }> = {};
  marks.forEach((m: any) => {
    const sid = m.subject_id;
    if (!subjectMap[sid]) subjectMap[sid] = { name: m.subjects?.name || "", total: 0, max: 0, count: 0 };
    subjectMap[sid].total += Number(m.marks_obtained) || 0;
    subjectMap[sid].max += Number(m.max_marks) || 0;
    subjectMap[sid].count++;
  });

  const subjectData = Object.values(subjectMap).map(s => ({
    name: s.name,
    average: s.count > 0 ? ((s.total / s.max) * 100) : 0,
  }));

  // Grade distribution
  const gradeDistribution = [
    { name: "A+ (90-100)", value: percentages.filter(p => p >= 90).length },
    { name: "A (80-89)", value: percentages.filter(p => p >= 80 && p < 90).length },
    { name: "B (60-79)", value: percentages.filter(p => p >= 60 && p < 80).length },
    { name: "C/D (40-59)", value: percentages.filter(p => p >= 40 && p < 60).length },
    { name: "F (<40)", value: percentages.filter(p => p < 40).length },
  ].filter(d => d.value > 0);

  // Top performers
  const ranked = [...students].sort((a, b) => {
    const pa = a.max > 0 ? (a.total / a.max) * 100 : 0;
    const pb = b.max > 0 ? (b.total / b.max) * 100 : 0;
    return pb - pa;
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Exam Analytics</h2>
        <p className="text-sm text-muted-foreground">Performance insights and trends</p>
      </div>

      <div className="flex gap-3">
        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
          <SelectTrigger className="w-60"><SelectValue placeholder="Select Exam" /></SelectTrigger>
          <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {marks.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{loading ? "Loading..." : "Select exam and class to view analytics"}</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{avgScore.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Average Score</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><Award className="h-5 w-5 text-success" /></div>
                <div><p className="text-2xl font-bold">{highest.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Highest Score</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="h-5 w-5 text-destructive" /></div>
                <div><p className="text-2xl font-bold">{lowest.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Lowest Score</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Users className="h-5 w-5 text-warning" /></div>
                <div><p className="text-2xl font-bold">{passRate.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Pass Rate ({passCount}/{students.length})</p></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject-wise Performance */}
            {subjectData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Subject-wise Average</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={subjectData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Grade Distribution */}
            {gradeDistribution.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Grade Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {gradeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Performers */}
          {ranked.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">🏆 Top Performers</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {ranked.map((s, i) => {
                    const pct = s.max > 0 ? (s.total / s.max) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                        <span className="font-bold text-lg text-primary">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.total}/{s.max} ({pct.toFixed(1)}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
