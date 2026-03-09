import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2, Trophy, TrendingUp, TrendingDown, AlertTriangle,
  BookOpen, Users, Printer, Download, Sparkles, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from "recharts";
import { exportToCSV } from "@/lib/csvExport";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface StudentResult {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  subjects: { name: string; obtained: number; max: number; pct: number }[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  rank: number;
  grade: string;
  weakSubjects: string[];
  strongSubjects: string[];
}

interface SubjectAnalysis {
  name: string;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  totalStudents: number;
}

export default function AIReportCard() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [loading, setLoading] = useState(false);

  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ grade: string; count: number }[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("exams").select("*, academic_years(name)").eq("school_id", schoolId).order("created_at", { ascending: false }),
    ]).then(([c, e]) => {
      setClasses(c.data || []);
      setExams(e.data || []);
    });
  }, [schoolId]);

  const getGrade = (pct: number) => {
    if (pct >= 91) return "A1";
    if (pct >= 81) return "A2";
    if (pct >= 71) return "B1";
    if (pct >= 61) return "B2";
    if (pct >= 51) return "C1";
    if (pct >= 41) return "C2";
    if (pct >= 33) return "D";
    return "E";
  };

  const generateReport = async () => {
    if (!selectedClass || !selectedExam || !schoolId) return;
    setLoading(true);

    try {
      // Get students in class
      const { data: students } = await supabase
        .from("students")
        .select("id, name, admission_number")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .eq("status", "active");

      if (!students?.length) {
        toast.error("No students found in this class");
        setLoading(false);
        return;
      }

      // Get all marks for this exam
      const { data: marks } = await supabase
        .from("exam_marks")
        .select("*, subjects(name)")
        .eq("exam_id", selectedExam)
        .eq("class_id", selectedClass);

      if (!marks?.length) {
        toast.error("No marks entered for this exam");
        setLoading(false);
        return;
      }

      // Group marks by student
      const studentMarksMap = new Map<string, typeof marks>();
      for (const mark of marks) {
        const existing = studentMarksMap.get(mark.student_id) || [];
        existing.push(mark);
        studentMarksMap.set(mark.student_id, existing);
      }

      // Calculate results for each student
      const results: StudentResult[] = [];
      const subjectStats: Map<string, { name: string; scores: number[]; max: number; passed: number }> = new Map();

      for (const student of students) {
        const studentMarks = studentMarksMap.get(student.id) || [];
        const subjects = studentMarks.map((m) => {
          const pct = m.max_marks > 0 ? (Number(m.marks_obtained || 0) / m.max_marks) * 100 : 0;
          const subjectName = m.subjects?.name || "Unknown";

          // Track subject stats
          const stats = subjectStats.get(subjectName) || { name: subjectName, scores: [], max: m.max_marks, passed: 0 };
          stats.scores.push(pct);
          if (pct >= 33) stats.passed++;
          subjectStats.set(subjectName, stats);

          return {
            name: subjectName,
            obtained: Number(m.marks_obtained || 0),
            max: m.max_marks,
            pct,
          };
        });

        const totalObtained = subjects.reduce((sum, s) => sum + s.obtained, 0);
        const totalMax = subjects.reduce((sum, s) => sum + s.max, 0);
        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        // Identify weak and strong subjects (below 40% weak, above 75% strong)
        const weakSubjects = subjects.filter((s) => s.pct < 40).map((s) => s.name);
        const strongSubjects = subjects.filter((s) => s.pct >= 75).map((s) => s.name);

        results.push({
          studentId: student.id,
          studentName: student.name,
          admissionNumber: student.admission_number,
          subjects,
          totalObtained,
          totalMax,
          percentage,
          rank: 0,
          grade: getGrade(percentage),
          weakSubjects,
          strongSubjects,
        });
      }

      // Sort by percentage and assign ranks
      results.sort((a, b) => b.percentage - a.percentage);
      let currentRank = 1;
      for (let i = 0; i < results.length; i++) {
        if (i > 0 && results[i].percentage < results[i - 1].percentage) {
          currentRank = i + 1;
        }
        results[i].rank = currentRank;
      }

      // Calculate subject analysis
      const analysis: SubjectAnalysis[] = Array.from(subjectStats.values()).map((s) => ({
        name: s.name,
        avgScore: s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
        highestScore: s.scores.length > 0 ? Math.max(...s.scores) : 0,
        lowestScore: s.scores.length > 0 ? Math.min(...s.scores) : 0,
        passRate: s.scores.length > 0 ? (s.passed / s.scores.length) * 100 : 0,
        totalStudents: s.scores.length,
      }));

      // Grade distribution
      const gradeCount: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, D: 0, E: 0 };
      for (const r of results) {
        gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
      }
      const grades = Object.entries(gradeCount).map(([grade, count]) => ({ grade, count }));

      setStudentResults(results);
      setSubjectAnalysis(analysis);
      setGradeDistribution(grades);
      toast.success("Report generated successfully!");
    } catch (e: any) {
      toast.error("Failed to generate report: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const topper = studentResults[0];
  const weakSubjectsOverall = subjectAnalysis.filter((s) => s.avgScore < 50);
  const strongSubjectsOverall = subjectAnalysis.filter((s) => s.avgScore >= 70);

  const handleExportRankList = () => {
    const data = studentResults.map((s) => ({
      Rank: s.rank,
      Name: s.studentName,
      "Adm. No": s.admissionNumber,
      "Total Obtained": s.totalObtained,
      "Total Max": s.totalMax,
      "Percentage": s.percentage.toFixed(1) + "%",
      Grade: s.grade,
      "Weak Subjects": s.weakSubjects.join(", ") || "None",
      "Strong Subjects": s.strongSubjects.join(", ") || "None",
    }));
    exportToCSV(data, `rank_list_${selectedExam}.csv`);
    toast.success("Rank list exported");
  };

  const radarData = subjectAnalysis.map((s) => ({
    subject: s.name.slice(0, 8),
    average: Math.round(s.avgScore),
    highest: Math.round(s.highestScore),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Report Card Generator
        </h1>
        <p className="text-muted-foreground">
          Auto-generate report cards, rank lists, and performance analytics
        </p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.academic_years?.name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={!selectedClass || !selectedExam || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {studentResults.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-10 w-10 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Class Topper</p>
                    <p className="text-lg font-bold">{topper?.studentName}</p>
                    <p className="text-xs text-muted-foreground">{topper?.percentage.toFixed(1)}% • {topper?.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{studentResults.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={weakSubjectsOverall.length > 0 ? "border-destructive/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-10 w-10 ${weakSubjectsOverall.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Weak Subjects</p>
                    <p className="text-lg font-bold">
                      {weakSubjectsOverall.length > 0 ? weakSubjectsOverall.map((s) => s.name).join(", ") : "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={strongSubjectsOverall.length > 0 ? "border-emerald-500/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className={`h-10 w-10 ${strongSubjectsOverall.length > 0 ? "text-emerald-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Strong Subjects</p>
                    <p className="text-lg font-bold">
                      {strongSubjectsOverall.length > 0 ? strongSubjectsOverall.map((s) => s.name).join(", ") : "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ranklist" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ranklist">Rank List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
            </TabsList>

            {/* Rank List Tab */}
            <TabsContent value="ranklist">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Class Rank List
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportRankList}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Adm. No</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Weak Subjects</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentResults.map((s) => (
                          <TableRow key={s.studentId} className={s.rank <= 3 ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-mono">
                              {s.rank <= 3 ? (
                                <Badge className={s.rank === 1 ? "bg-amber-500" : s.rank === 2 ? "bg-slate-400" : "bg-amber-700"}>
                                  #{s.rank}
                                </Badge>
                              ) : (
                                `#${s.rank}`
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{s.studentName}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{s.admissionNumber}</TableCell>
                            <TableCell className="text-right">{s.totalObtained}/{s.totalMax}</TableCell>
                            <TableCell className="text-right font-semibold">{s.percentage.toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                s.grade.startsWith("A") ? "bg-emerald-500/10 text-emerald-500" :
                                s.grade.startsWith("B") ? "bg-blue-500/10 text-blue-500" :
                                s.grade === "E" ? "bg-destructive/10 text-destructive" :
                                ""
                              }>
                                {s.grade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {s.weakSubjects.length > 0 ? (
                                <span className="text-sm text-destructive">{s.weakSubjects.join(", ")}</span>
                              ) : (
                                <span className="text-sm text-emerald-500">None</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution.filter((g) => g.count > 0)}
                            dataKey="count"
                            nameKey="grade"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ grade, count }) => `${grade}: ${count}`}
                          >
                            {gradeDistribution.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Class Average" dataKey="average" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                          <Radar name="Highest" dataKey="highest" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Distribution Bar */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Subject-wise Average Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                          <Legend />
                          <Bar dataKey="avgScore" name="Average %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subject Analysis Tab */}
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subject-wise Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-right">Students</TableHead>
                          <TableHead className="text-right">Average %</TableHead>
                          <TableHead className="text-right">Highest %</TableHead>
                          <TableHead className="text-right">Lowest %</TableHead>
                          <TableHead className="text-right">Pass Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectAnalysis.map((s) => (
                          <TableRow key={s.name}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-right">{s.totalStudents}</TableCell>
                            <TableCell className="text-right font-semibold">{s.avgScore.toFixed(1)}%</TableCell>
                            <TableCell className="text-right text-emerald-500">{s.highestScore.toFixed(1)}%</TableCell>
                            <TableCell className="text-right text-destructive">{s.lowestScore.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{s.passRate.toFixed(1)}%</TableCell>
                            <TableCell>
                              {s.avgScore < 50 ? (
                                <Badge variant="destructive" className="gap-1">
                                  <TrendingDown className="h-3 w-3" /> Weak
                                </Badge>
                              ) : s.avgScore >= 70 ? (
                                <Badge className="bg-emerald-500 gap-1">
                                  <TrendingUp className="h-3 w-3" /> Strong
                                </Badge>
                              ) : (
                                <Badge variant="outline">Average</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Improvements Tab */}
            <TabsContent value="improvements">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students needing improvement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Students Needing Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentResults.filter((s) => s.weakSubjects.length > 0).length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">All students are performing well! 🎉</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-auto">
                        {studentResults
                          .filter((s) => s.weakSubjects.length > 0)
                          .sort((a, b) => b.weakSubjects.length - a.weakSubjects.length)
                          .map((s) => (
                            <div key={s.studentId} className="flex items-start justify-between p-3 rounded-lg border bg-destructive/5">
                              <div>
                                <p className="font-medium">{s.studentName}</p>
                                <p className="text-xs text-muted-foreground">Rank #{s.rank} • {s.percentage.toFixed(1)}%</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Weak in:</p>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {s.weakSubjects.map((sub) => (
                                    <Badge key={sub} variant="destructive" className="text-xs">{sub}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-500">
                      <Trophy className="h-5 w-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-auto">
                      {studentResults.slice(0, 10).map((s, idx) => (
                        <div key={s.studentId} className={`flex items-center justify-between p-3 rounded-lg border ${idx < 3 ? "bg-amber-500/5 border-amber-500/30" : ""}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx === 0 ? "bg-amber-500 text-white" :
                              idx === 1 ? "bg-slate-400 text-white" :
                              idx === 2 ? "bg-amber-700 text-white" :
                              "bg-muted"
                            }`}>
                              {s.rank}
                            </div>
                            <div>
                              <p className="font-medium">{s.studentName}</p>
                              <p className="text-xs text-muted-foreground">{s.admissionNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{s.percentage.toFixed(1)}%</p>
                            <Badge variant="outline">{s.grade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
