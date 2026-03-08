import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [academicYearId, setAcademicYearId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(id, name), academic_years(id, name, status)")
        .eq("teacher_id", t.id);
      setAssignments(assigns || []);

      // Find active academic year
      const activeYear = assigns?.find(a => a.academic_years?.status === "active");
      if (activeYear) setAcademicYearId(activeYear.academic_year_id);

      setLoading(false);
    }
    fetch();
  }, [user]);

  // Get unique classes from assignments
  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  useEffect(() => {
    if (!selectedClass || !teacher) return;
    async function fetchStudents() {
      const { data } = await supabase
        .from("students")
        .select("id, name, admission_number")
        .eq("school_id", teacher.school_id)
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("name");
      setStudents(data || []);

      // Check existing attendance
      if (academicYearId) {
        const { data: existing } = await supabase
          .from("attendance")
          .select("student_id, status")
          .eq("school_id", teacher.school_id)
          .eq("class_id", selectedClass)
          .eq("date", selectedDate)
          .eq("academic_year_id", academicYearId);
        if (existing && existing.length > 0) {
          const map: Record<string, string> = {};
          existing.forEach(e => { map[e.student_id] = e.status; });
          setAttendance(map);
          setExistingRecords(true);
        } else {
          // Default all to present
          const map: Record<string, string> = {};
          (data || []).forEach(s => { map[s.id] = "present"; });
          setAttendance(map);
          setExistingRecords(false);
        }
      }
    }
    fetchStudents();
  }, [selectedClass, selectedDate, teacher, academicYearId]);

  const handleSave = async () => {
    if (!teacher || !selectedClass || !academicYearId) return;
    setSaving(true);

    // Delete existing records for this date/class
    await supabase
      .from("attendance")
      .delete()
      .eq("school_id", teacher.school_id)
      .eq("class_id", selectedClass)
      .eq("date", selectedDate)
      .eq("academic_year_id", academicYearId);

    const records = students.map(s => ({
      school_id: teacher.school_id,
      student_id: s.id,
      class_id: selectedClass,
      academic_year_id: academicYearId,
      date: selectedDate,
      status: attendance[s.id] || "present",
      marked_by: user!.id,
    }));

    const { error } = await supabase.from("attendance").insert(records);
    if (error) toast.error(error.message);
    else {
      toast.success("Attendance saved successfully");
      setExistingRecords(true);
      // Auto-send absence SMS
      const absentIds = students.filter(s => attendance[s.id] === "absent").map(s => s.id);
      if (absentIds.length > 0) {
        supabase.functions.invoke("send-absence-sms", {
          body: { school_id: teacher.school_id, absent_student_ids: absentIds, date: selectedDate },
        }).then(({ error: smsErr }) => {
          if (!smsErr) toast.info(`Absence SMS sent to ${absentIds.length} parents`);
        });
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found.</div>;

  const presentCount = Object.values(attendance).filter(v => v === "present").length;
  const absentCount = Object.values(attendance).filter(v => v === "absent").length;
  const leaveCount = Object.values(attendance).filter(v => v === "leave").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground">Select a class and date to mark attendance</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
        </div>
      </div>

      {selectedClass && students.length > 0 && (
        <>
          <div className="flex gap-3">
            <Badge variant="outline" className="bg-success/10 text-success">Present: {presentCount}</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">Absent: {absentCount}</Badge>
            <Badge variant="outline" className="bg-warning/10 text-warning">Leave: {leaveCount}</Badge>
            {existingRecords && <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Already marked</Badge>}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {students.map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8">{idx + 1}</span>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {["present", "absent", "leave"].map(status => (
                        <Button
                          key={status}
                          size="sm"
                          variant={attendance[student.id] === status ? "default" : "outline"}
                          className={attendance[student.id] === status ?
                            (status === "present" ? "bg-success hover:bg-success/90" :
                              status === "absent" ? "bg-destructive hover:bg-destructive/90" :
                                "bg-warning hover:bg-warning/90") : ""}
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: status }))}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance
          </Button>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <p className="text-muted-foreground">No active students in this class</p>
      )}
    </div>
  );
}
