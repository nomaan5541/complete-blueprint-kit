import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, PenLine, FileQuestion, Monitor, BookOpen, Eye, BarChart3 } from "lucide-react";
import ExamCreateDialog from "@/components/exams/ExamCreateDialog";
import QuestionBuilder from "@/components/exams/QuestionBuilder";
import OfflineMarksEntry from "@/components/exams/OfflineMarksEntry";
import ExamAnalytics from "@/components/exams/ExamAnalytics";

export default function ExamManagement() {
  const { schoolId } = useSchool();
  const { academicYears, selectedYearId } = useAcademicYear();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [questionExam, setQuestionExam] = useState<any>(null);
  const [marksExam, setMarksExam] = useState<any>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultExamId, setResultExamId] = useState("");
  const [resultClassId, setResultClassId] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

  const fetchAll = async () => {
    if (!schoolId || !selectedYearId) return;
    setLoading(true);
    const [eRes, cRes, sRes, stRes] = await Promise.all([
      supabase.from("exams").select("*, academic_years(name), classes(name), subjects(name)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("students").select("id, name, admission_number, class_id").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).eq("status", "active").order("name"),
    ]);
    setExams(eRes.data || []);
    setClasses(cRes.data || []);
    setSubjects(sRes.data || []);
    setStudents(stRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId, selectedYearId]);

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Exam deleted"); fetchAll(); }
  };

  const updateExamStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("exams").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Exam ${status}`); fetchAll(); }
  };

  const filteredExams = exams.filter(e => {
    if (modeFilter === "all") return true;
    return (e as any).exam_mode === modeFilter;
  });

  const loadResults = async () => {
    if (!resultExamId || !resultClassId) return;
    const { data } = await supabase.from("exam_marks").select("*, students(name, admission_number), subjects(name)")
      .eq("exam_id", resultExamId).eq("class_id", resultClassId);
    setMarks(data || []);
    setResultsOpen(true);
  };

  const resultsByStudent = marks.reduce((acc: Record<string, any>, m: any) => {
    if (!acc[m.student_id]) {
      acc[m.student_id] = { name: m.students?.name, admNo: m.students?.admission_number, subjects: [], total: 0, maxTotal: 0 };
    }
    acc[m.student_id].subjects.push({ name: m.subjects?.name, obtained: m.marks_obtained, max: m.max_marks, grade: (m as any).grade });
    acc[m.student_id].total += Number(m.marks_obtained) || 0;
    acc[m.student_id].maxTotal += Number(m.max_marks) || 0;
    return acc;
  }, {});

  const getGrade = (pct: number) => {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "F";
  };

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Exams & Results</h1>
          <p className="text-muted-foreground text-sm">Online MCQ exams & offline marks entry</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
      </div>

      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="results">View Results</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-1 h-3 w-3" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <div className="flex gap-2">
            <Badge variant={modeFilter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setModeFilter("all")}>All</Badge>
            <Badge variant={modeFilter === "offline" ? "default" : "outline"} className="cursor-pointer" onClick={() => setModeFilter("offline")}>
              <BookOpen className="h-3 w-3 mr-1" /> Offline
            </Badge>
            <Badge variant={modeFilter === "online" ? "default" : "outline"} className="cursor-pointer" onClick={() => setModeFilter("online")}>
              <Monitor className="h-3 w-3 mr-1" /> Online
            </Badge>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredExams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No exams found</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => {
                const mode = (exam as any).exam_mode || "offline";
                const status = (exam as any).status || "draft";
                return (
                  <Card key={exam.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{exam.name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {mode === "online" ? "💻 Online" : "📝 Offline"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{exam.exam_type}</Badge>
                            <Badge className={`text-xs ${statusColor[status] || ""}`}>{status}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteExam(exam.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {(exam as any).classes?.name && <p>Class: {(exam as any).classes.name}</p>}
                        {(exam as any).subjects?.name && <p>Subject: {(exam as any).subjects.name}</p>}
                        {(exam as any).exam_date && <p>📅 {(exam as any).exam_date}</p>}
                        {!(exam as any).exam_date && exam.start_date && <p>📅 {exam.start_date} → {exam.end_date}</p>}
                        <p>Total Marks: {(exam as any).total_marks || 100}</p>
                        {mode === "online" && (exam as any).duration_minutes && (
                          <p>⏱ {(exam as any).duration_minutes} minutes</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mode === "online" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setQuestionExam(exam)}>
                              <FileQuestion className="mr-1 h-3 w-3" /> Questions
                            </Button>
                            {status === "draft" && (
                              <Button size="sm" variant="default" onClick={() => updateExamStatus(exam.id, "published")}>
                                Publish
                              </Button>
                            )}
                            {status === "published" && (
                              <Button size="sm" variant="secondary" onClick={() => updateExamStatus(exam.id, "completed")}>
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                        {mode === "offline" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setMarksExam(exam)}>
                              <PenLine className="mr-1 h-3 w-3" /> Enter Marks
                            </Button>
                            {status === "draft" && (
                              <Button size="sm" variant="default" onClick={() => updateExamStatus(exam.id, "published")}>
                                Publish
                              </Button>
                            )}
                            {status === "published" && (
                              <Button size="sm" variant="secondary" onClick={() => updateExamStatus(exam.id, "completed")}>
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Exam</label>
              <Select value={resultExamId} onValueChange={setResultExamId}>
                <SelectTrigger className="w-60"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Class</label>
              <Select value={resultClassId} onValueChange={setResultClassId}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={loadResults} disabled={!resultExamId || !resultClassId}>
              <Eye className="mr-2 h-4 w-4" /> View Results
            </Button>
          </div>

          {resultsOpen && Object.keys(resultsByStudent).length > 0 && (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultsByStudent).map(([id, r]: [string, any]) => {
                    const pct = r.maxTotal > 0 ? (r.total / r.maxTotal) * 100 : 0;
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.admNo}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {r.subjects.map((s: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {s.name}: {s.obtained}/{s.max}
                                {s.grade && <span className="ml-1 font-semibold">({s.grade})</span>}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{r.total}/{r.maxTotal}</TableCell>
                        <TableCell className="font-mono">{pct.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={pct >= 50 ? "default" : "destructive"}>{getGrade(pct)}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {resultsOpen && Object.keys(resultsByStudent).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No results found for this selection</p>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <ExamAnalytics />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {schoolId && selectedYearId && (
        <ExamCreateDialog open={createOpen} onOpenChange={setCreateOpen}
          schoolId={schoolId} academicYearId={selectedYearId}
          classes={classes} subjects={subjects} onCreated={fetchAll} />
      )}

      {questionExam && (
        <QuestionBuilder exam={questionExam} open={!!questionExam} onOpenChange={open => !open && setQuestionExam(null)} />
      )}

      {marksExam && schoolId && selectedYearId && (
        <OfflineMarksEntry exam={marksExam} open={!!marksExam} onOpenChange={open => !open && setMarksExam(null)}
          schoolId={schoolId} academicYearId={selectedYearId}
          classes={classes} subjects={subjects} students={students} />
      )}
    </div>
  );
}
