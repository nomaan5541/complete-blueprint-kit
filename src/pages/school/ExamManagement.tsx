import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, PenLine } from "lucide-react";

export default function ExamManagement() {
  const { schoolId } = useSchool();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [examOpen, setExamOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marksData, setMarksData] = useState<{ studentId: string; studentName: string; marks: string; maxMarks: string }[]>([]);
  const [resultExamId, setResultExamId] = useState("");
  const [resultClassId, setResultClassId] = useState("");

  const [examForm, setExamForm] = useState({ name: "", exam_type: "exam", academic_year_id: "", start_date: "", end_date: "" });

  const fetchAll = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [eRes, cRes, sRes, stRes, yRes] = await Promise.all([
      supabase.from("exams").select("*, academic_years(name)").eq("school_id", schoolId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("students").select("id, name, admission_number, class_id").eq("school_id", schoolId).eq("status", "active").order("name"),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).order("start_date", { ascending: false }),
    ]);
    setExams(eRes.data || []);
    setClasses(cRes.data || []);
    setSubjects(sRes.data || []);
    setStudents(stRes.data || []);
    setAcademicYears(yRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const handleCreateExam = async () => {
    if (!examForm.name.trim() || !examForm.academic_year_id) { toast.error("Name and academic year are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("exams").insert({
      school_id: schoolId!,
      name: examForm.name.trim(),
      exam_type: examForm.exam_type,
      academic_year_id: examForm.academic_year_id,
      start_date: examForm.start_date || null,
      end_date: examForm.end_date || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Exam created"); setExamOpen(false); setExamForm({ name: "", exam_type: "exam", academic_year_id: "", start_date: "", end_date: "" }); fetchAll(); }
    setSaving(false);
  };

  const openEnterMarks = (exam: any) => {
    setSelectedExam(exam);
    setSelectedClassId("");
    setSelectedSubjectId("");
    setMarksData([]);
    setMarksOpen(true);
  };

  const loadStudentsForMarks = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExam) return;
    const classStudents = students.filter((s) => s.class_id === selectedClassId);

    // Load existing marks
    const { data: existingMarks } = await supabase.from("exam_marks").select("*")
      .eq("exam_id", selectedExam.id).eq("subject_id", selectedSubjectId).eq("class_id", selectedClassId);

    const marksMap: Record<string, any> = {};
    (existingMarks || []).forEach((m: any) => { marksMap[m.student_id] = m; });

    setMarksData(classStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      marks: marksMap[s.id]?.marks_obtained?.toString() || "",
      maxMarks: marksMap[s.id]?.max_marks?.toString() || "100",
    })));
  };

  useEffect(() => { if (selectedClassId && selectedSubjectId) loadStudentsForMarks(); }, [selectedClassId, selectedSubjectId]);

  const saveMarks = async () => {
    if (!selectedExam || !selectedClassId || !selectedSubjectId) return;
    setSaving(true);

    for (const md of marksData) {
      if (md.marks === "") continue;
      const { error } = await supabase.from("exam_marks").upsert({
        school_id: schoolId!,
        exam_id: selectedExam.id,
        student_id: md.studentId,
        subject_id: selectedSubjectId,
        class_id: selectedClassId,
        marks_obtained: parseFloat(md.marks),
        max_marks: parseFloat(md.maxMarks),
      }, { onConflict: "exam_id,student_id,subject_id" });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success("Marks saved");
    setSaving(false);
  };

  const loadResults = async () => {
    if (!resultExamId || !resultClassId) return;
    const { data } = await supabase.from("exam_marks").select("*, students(name, admission_number), subjects(name)")
      .eq("exam_id", resultExamId).eq("class_id", resultClassId);
    setMarks(data || []);
    setResultsOpen(true);
  };

  // Compute results grouped by student
  const resultsByStudent = marks.reduce((acc: Record<string, any>, m: any) => {
    if (!acc[m.student_id]) {
      acc[m.student_id] = { name: m.students?.name, admNo: m.students?.admission_number, subjects: [], total: 0, maxTotal: 0 };
    }
    acc[m.student_id].subjects.push({ name: m.subjects?.name, obtained: m.marks_obtained, max: m.max_marks });
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

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Exam deleted"); fetchAll(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams & Results</h1>
          <p className="text-muted-foreground">Manage exams, enter marks, view results</p>
        </div>
        <Button onClick={() => setExamOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
      </div>

      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="results">View Results</TabsTrigger>
        </TabsList>

        <TabsContent value="exams">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? <p className="text-muted-foreground">Loading...</p> : exams.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">No exams created</p>
            ) : exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{exam.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{exam.academic_years?.name} · {exam.exam_type}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteExam(exam.id)} className="text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="flex gap-2">
                  {exam.start_date && <Badge variant="outline" className="text-xs">{exam.start_date} → {exam.end_date}</Badge>}
                  <Button size="sm" variant="outline" onClick={() => openEnterMarks(exam)}>
                    <PenLine className="mr-1 h-3 w-3" /> Enter Marks
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex gap-4">
            <Select value={resultExamId} onValueChange={setResultExamId}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Select Exam" /></SelectTrigger>
              <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={resultClassId} onValueChange={setResultClassId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={loadResults}>View Results</Button>
          </div>

          {resultsOpen && Object.keys(resultsByStudent).length > 0 && (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultsByStudent).map(([id, r]: [string, any]) => {
                    const pct = r.maxTotal > 0 ? (r.total / r.maxTotal) * 100 : 0;
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{r.name} <span className="text-muted-foreground text-xs">({r.admNo})</span></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {r.subjects.map((s: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{s.name}: {s.obtained}/{s.max}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{r.total}/{r.maxTotal}</TableCell>
                        <TableCell>{pct.toFixed(1)}%</TableCell>
                        <TableCell><Badge variant={pct >= 50 ? "default" : "destructive"}>{getGrade(pct)}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {resultsOpen && Object.keys(resultsByStudent).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No results found</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Exam Dialog */}
      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={examForm.name} onChange={(e) => setExamForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mid Term" /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={examForm.exam_type} onValueChange={(v) => setExamForm(p => ({ ...p, exam_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit_test">Unit Test</SelectItem>
                  <SelectItem value="mid_term">Mid Term</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Academic Year</Label>
              <Select value={examForm.academic_year_id} onValueChange={(v) => setExamForm(p => ({ ...p, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={examForm.start_date} onChange={(e) => setExamForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>End Date</Label><Input type="date" value={examForm.end_date} onChange={(e) => setExamForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExam} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog open={marksOpen} onOpenChange={setMarksOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enter Marks — {selectedExam?.name}</DialogTitle></DialogHeader>
          <div className="flex gap-3 mb-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {marksData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marksData.map((md, i) => (
                  <TableRow key={md.studentId}>
                    <TableCell className="font-medium">{md.studentName}</TableCell>
                    <TableCell>
                      <Input type="number" className="w-20 h-8" value={md.marks}
                        onChange={(e) => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, marks: e.target.value } : m))} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="w-20 h-8" value={md.maxMarks}
                        onChange={(e) => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, maxMarks: e.target.value } : m))} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {marksData.length === 0 && selectedClassId && selectedSubjectId && (
            <p className="text-center text-muted-foreground py-4">No students in this class</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMarksOpen(false)}>Cancel</Button>
            <Button onClick={saveMarks} disabled={saving || marksData.length === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
