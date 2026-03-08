import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TeacherMarks() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { obtained: string; max: string }>>({});
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(id, name), subjects(id, name), academic_years(id, name, status)")
        .eq("teacher_id", t.id);
      setAssignments(assigns || []);

      const { data: ex } = await supabase.from("exams").select("*").eq("school_id", t.school_id).order("created_at", { ascending: false });
      setExams(ex || []);

      setLoading(false);
    }
    fetch();
  }, [user]);

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  const subjectsForClass = assignments
    .filter(a => a.class_id === selectedClass)
    .map(a => ({ id: a.subject_id, name: a.subjects?.name }));

  useEffect(() => {
    if (!selectedClass || !selectedExam || !selectedSubject || !teacher) return;
    async function fetchStudentsAndMarks() {
      const { data: studs } = await supabase
        .from("students")
        .select("id, name, admission_number")
        .eq("school_id", teacher.school_id)
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("name");
      setStudents(studs || []);

      const { data: existing } = await supabase
        .from("exam_marks")
        .select("student_id, marks_obtained, max_marks")
        .eq("exam_id", selectedExam)
        .eq("subject_id", selectedSubject)
        .eq("class_id", selectedClass);

      const map: Record<string, { obtained: string; max: string }> = {};
      (studs || []).forEach(s => {
        const ex = existing?.find(e => e.student_id === s.id);
        map[s.id] = { obtained: ex?.marks_obtained?.toString() || "", max: ex?.max_marks?.toString() || "100" };
      });
      setMarks(map);
    }
    fetchStudentsAndMarks();
  }, [selectedClass, selectedExam, selectedSubject, teacher]);

  const handleSave = async () => {
    if (!teacher || !selectedClass || !selectedExam || !selectedSubject) return;
    setSaving(true);

    // Delete existing marks for this combo
    await supabase.from("exam_marks").delete()
      .eq("exam_id", selectedExam)
      .eq("subject_id", selectedSubject)
      .eq("class_id", selectedClass)
      .eq("school_id", teacher.school_id);

    const records = students
      .filter(s => marks[s.id]?.obtained !== "")
      .map(s => ({
        school_id: teacher.school_id,
        exam_id: selectedExam,
        student_id: s.id,
        subject_id: selectedSubject,
        class_id: selectedClass,
        marks_obtained: parseFloat(marks[s.id].obtained),
        max_marks: parseFloat(marks[s.id].max) || 100,
      }));

    if (records.length === 0) { toast.error("Enter marks for at least one student"); setSaving(false); return; }

    const { error } = await supabase.from("exam_marks").insert(records);
    if (error) toast.error(error.message);
    else toast.success("Marks saved successfully");
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enter Marks</h1>
        <p className="text-muted-foreground">Select exam, class, and subject to enter student marks</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>Exam</Label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSubject(""); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {selectedClass && selectedExam && selectedSubject && students.length > 0 && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="grid grid-cols-[2rem_1fr_6rem_6rem] gap-3 px-3 pb-2 text-sm font-medium text-muted-foreground">
                  <span>#</span><span>Student</span><span>Max</span><span>Obtained</span>
                </div>
                {students.map((student, idx) => (
                  <div key={student.id} className="grid grid-cols-[2rem_1fr_6rem_6rem] gap-3 items-center rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                    </div>
                    <Input
                      type="number"
                      value={marks[student.id]?.max || "100"}
                      onChange={e => setMarks(prev => ({ ...prev, [student.id]: { ...prev[student.id], max: e.target.value } }))}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={marks[student.id]?.obtained || ""}
                      onChange={e => setMarks(prev => ({ ...prev, [student.id]: { ...prev[student.id], obtained: e.target.value } }))}
                      className="h-8"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Marks
          </Button>
        </>
      )}
    </div>
  );
}
