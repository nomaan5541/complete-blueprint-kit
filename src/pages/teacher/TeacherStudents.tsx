import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TeacherStudents() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(id, name)")
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
    async function fetchStudents() {
      const { data } = await supabase
        .from("students")
        .select("*, classes(name), sections(name)")
        .eq("school_id", teacher.school_id)
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("name");
      setStudents(data || []);
    }
    fetchStudents();
  }, [selectedClass, teacher]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student List</h1>
        <p className="text-muted-foreground">View students in your assigned classes</p>
      </div>

      <div className="space-y-1">
        <Label>Select Class</Label>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Gender</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.admission_number}</TableCell>
                    <TableCell>{s.classes?.name || "—"}</TableCell>
                    <TableCell>{s.sections?.name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{s.gender || "—"}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
