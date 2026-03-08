import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";

export default function ReportCard() {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [cRes, eRes, sRes, gRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("exams").select("*, academic_years(name)").eq("school_id", schoolId!).order("created_at", { ascending: false }),
        supabase.from("schools").select("*").eq("id", schoolId!).single(),
        supabase.from("grade_systems").select("*").eq("school_id", schoolId!).order("min_marks", { ascending: false }),
      ]);
      setClasses(cRes.data || []);
      setExams(eRes.data || []);
      setSchool(sRes.data);
      setGrades(gRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass || !schoolId) return;
    async function fetchStudents() {
      const { data } = await supabase.from("students").select("id, name, admission_number")
        .eq("school_id", schoolId!).eq("class_id", selectedClass).eq("status", "active").order("name");
      setStudents(data || []);
    }
    fetchStudents();
  }, [selectedClass, schoolId]);

  useEffect(() => {
    if (!selectedStudent || !selectedExam) { setMarks([]); return; }
    async function fetchMarks() {
      const { data } = await supabase.from("exam_marks")
        .select("*, subjects(name)")
        .eq("student_id", selectedStudent)
        .eq("exam_id", selectedExam);
      setMarks(data || []);
    }
    fetchMarks();
  }, [selectedStudent, selectedExam]);

  const getGrade = (pct: number) => {
    const g = grades.find(g => pct >= Number(g.min_marks) && pct <= Number(g.max_marks));
    return g?.grade || "—";
  };

  const totalObtained = marks.reduce((sum, m) => sum + (Number(m.marks_obtained) || 0), 0);
  const totalMax = marks.reduce((sum, m) => sum + Number(m.max_marks), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0";
  const overallGrade = getGrade(parseFloat(percentage));

  const student = students.find(s => s.id === selectedStudent);
  const exam = exams.find(e => e.id === selectedExam);
  const cls = classes.find(c => c.id === selectedClass);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Report Card</h1>
        <p className="text-muted-foreground">Generate and print student report cards</p>
      </div>

      <div className="flex flex-wrap gap-4 no-print">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedStudent(""); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Exam</Label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudent && selectedExam && marks.length > 0 && (
        <>
          <div className="no-print flex justify-end">
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Report Card</Button>
          </div>

          <div ref={printRef} className="print-area">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 space-y-6">
                {/* School Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold">{school?.name}</h2>
                  {school?.address && <p className="text-sm text-muted-foreground">{[school.address, school.city, school.state].filter(Boolean).join(", ")}</p>}
                  {school?.phone && <p className="text-sm text-muted-foreground">Phone: {school.phone}</p>}
                  <h3 className="text-lg font-semibold mt-3">REPORT CARD</h3>
                  <p className="text-sm">{exam?.name} — {exam?.academic_years?.name}</p>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                  <div><span className="text-muted-foreground">Student Name: </span><strong>{student?.name}</strong></div>
                  <div><span className="text-muted-foreground">Adm. No: </span><strong>{student?.admission_number}</strong></div>
                  <div><span className="text-muted-foreground">Class: </span><strong>{cls?.name}</strong></div>
                  <div><span className="text-muted-foreground">Exam: </span><strong>{exam?.name}</strong></div>
                </div>

                {/* Marks Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Max Marks</TableHead>
                      <TableHead className="text-center">Obtained</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map((m, idx) => {
                      const pct = Number(m.max_marks) > 0 ? (Number(m.marks_obtained || 0) / Number(m.max_marks)) * 100 : 0;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{m.subjects?.name}</TableCell>
                          <TableCell className="text-center">{m.max_marks}</TableCell>
                          <TableCell className="text-center">{m.marks_obtained ?? "—"}</TableCell>
                          <TableCell className="text-center">{pct.toFixed(1)}%</TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{getGrade(pct)}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-center">{totalMax}</TableCell>
                      <TableCell className="text-center">{totalObtained}</TableCell>
                      <TableCell className="text-center">{percentage}%</TableCell>
                      <TableCell className="text-center"><Badge>{overallGrade}</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Footer */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-sm">
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2">Class Teacher</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2">Principal</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {selectedStudent && selectedExam && marks.length === 0 && (
        <p className="text-muted-foreground text-center py-10">No marks found for this student in the selected exam.</p>
      )}
    </div>
  );
}
