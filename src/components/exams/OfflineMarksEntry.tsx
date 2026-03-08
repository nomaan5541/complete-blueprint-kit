import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  exam: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  academicYearId: string;
  classes: any[];
  subjects: any[];
  students: any[];
}

interface MarkRow {
  studentId: string;
  studentName: string;
  admNo: string;
  marks: string;
  maxMarks: string;
  grade: string;
  remarks: string;
  existingId?: string;
}

export default function OfflineMarksEntry({ exam, open, onOpenChange, schoolId, academicYearId, classes, subjects, students }: Props) {
  const [classId, setClassId] = useState(exam?.class_id || "");
  const [subjectId, setSubjectId] = useState(exam?.subject_id || "");
  const [marksData, setMarksData] = useState<MarkRow[]>([]);
  const [saving, setSaving] = useState(false);

  const loadStudents = async () => {
    if (!classId || !subjectId) return;
    const classStudents = students.filter(s => s.class_id === classId);

    const { data: existing } = await supabase.from("exam_marks")
      .select("*").eq("exam_id", exam.id).eq("subject_id", subjectId).eq("class_id", classId);

    const map: Record<string, any> = {};
    (existing || []).forEach((m: any) => { map[m.student_id] = m; });

    setMarksData(classStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      admNo: s.admission_number,
      marks: map[s.id]?.marks_obtained?.toString() || "",
      maxMarks: map[s.id]?.max_marks?.toString() || (exam.total_marks?.toString() || "100"),
      grade: (map[s.id] as any)?.grade || "",
      remarks: (map[s.id] as any)?.remarks || "",
      existingId: map[s.id]?.id,
    })));
  };

  useEffect(() => { if (classId && subjectId) loadStudents(); }, [classId, subjectId]);

  const getGrade = (marks: number, max: number): string => {
    const pct = max > 0 ? (marks / max) * 100 : 0;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "F";
  };

  const autoGrade = () => {
    setMarksData(prev => prev.map(m => {
      if (m.marks === "") return m;
      return { ...m, grade: getGrade(parseFloat(m.marks), parseFloat(m.maxMarks)) };
    }));
  };

  const saveMarks = async () => {
    setSaving(true);
    try {
      for (const md of marksData) {
        if (md.marks === "") continue;
        const payload = {
          school_id: schoolId,
          exam_id: exam.id,
          student_id: md.studentId,
          subject_id: subjectId,
          class_id: classId,
          marks_obtained: parseFloat(md.marks),
          max_marks: parseFloat(md.maxMarks),
          grade: md.grade || null,
          remarks: md.remarks || null,
        };
        const { error } = await supabase.from("exam_marks").upsert(payload as any, { onConflict: "exam_id,student_id,subject_id" });
        if (error) throw error;
      }
      toast.success("Marks saved successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save marks");
    }
    setSaving(false);
  };

  const filledCount = marksData.filter(m => m.marks !== "").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Marks — {exam?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 mb-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {marksData.length > 0 && (
            <Button variant="secondary" size="sm" onClick={autoGrade}>Auto Grade</Button>
          )}
        </div>

        {marksData.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline">{filledCount}/{marksData.length} entered</Badge>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-20">Marks</TableHead>
                    <TableHead className="w-20">Max</TableHead>
                    <TableHead className="w-16">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marksData.map((md, i) => (
                    <TableRow key={md.studentId}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{md.studentName}</div>
                        <div className="text-xs text-muted-foreground">{md.admNo}</div>
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-20 h-8 text-sm" value={md.marks}
                          onChange={e => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, marks: e.target.value } : m))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-20 h-8 text-sm" value={md.maxMarks}
                          onChange={e => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, maxMarks: e.target.value } : m))} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-16 h-8 text-sm" value={md.grade}
                          onChange={e => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, grade: e.target.value } : m))} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-8 text-sm" value={md.remarks} placeholder="Optional"
                          onChange={e => setMarksData(prev => prev.map((m, idx) => idx === i ? { ...m, remarks: e.target.value } : m))} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : classId && subjectId ? (
          <p className="text-center text-muted-foreground py-6">No students found in this class</p>
        ) : (
          <p className="text-center text-muted-foreground py-6">Select class and subject to load students</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={saveMarks} disabled={saving || marksData.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Marks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
