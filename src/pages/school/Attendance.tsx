import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";

type AttendanceStatus = "present" | "absent" | "leave";

interface StudentAttendance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: AttendanceStatus;
  existingId?: string;
}

export default function Attendance() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [cRes, sRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("sections").select("*").eq("school_id", schoolId!),
      ]);
      setClasses(cRes.data || []);
      setSections(sRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const filteredSections = sections.filter((s) => s.class_id === selectedClass);

  const loadAttendance = async () => {
    if (!selectedClass || !selectedYearId || !selectedDate || !schoolId) {
      toast.error("Select class and date"); return;
    }
    setAttendanceLoaded(false);

    // Get students for selected class/section
    let studentsQuery = supabase.from("students").select("id, name, admission_number")
      .eq("school_id", schoolId).eq("class_id", selectedClass).eq("status", "active").order("name");
    if (selectedSection) studentsQuery = studentsQuery.eq("section_id", selectedSection);
    const { data: studentsData } = await studentsQuery;

    // Get existing attendance
    const studentIds = (studentsData || []).map((s: any) => s.id);
    let existingMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: existing } = await supabase.from("attendance").select("*")
        .in("student_id", studentIds).eq("date", selectedDate);
      (existing || []).forEach((a: any) => { existingMap[a.student_id] = a; });
    }

    setStudentAttendance(
      (studentsData || []).map((s: any) => ({
        studentId: s.id,
        studentName: s.name,
        admissionNumber: s.admission_number,
        status: existingMap[s.id]?.status || "present",
        existingId: existingMap[s.id]?.id,
      }))
    );
    setAttendanceLoaded(true);
  };

  const toggleStatus = (index: number, status: AttendanceStatus) => {
    setStudentAttendance((prev) => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const saveAttendance = async () => {
    if (!schoolId || !selectedClass || !selectedYearId) return;
    setSaving(true);

    const toInsert = studentAttendance.filter((s) => !s.existingId).map((s) => ({
      school_id: schoolId!,
      student_id: s.studentId,
      class_id: selectedClass,
      section_id: selectedSection || null,
      academic_year_id: selectedYearId,
      date: selectedDate,
      status: s.status,
      marked_by: user?.id,
    }));

    const toUpdate = studentAttendance.filter((s) => s.existingId);

    let hasError = false;
    if (toInsert.length > 0) {
      const { error } = await supabase.from("attendance").insert(toInsert);
      if (error) { toast.error(error.message); hasError = true; }
    }

    for (const s of toUpdate) {
      const { error } = await supabase.from("attendance").update({ status: s.status }).eq("id", s.existingId!);
      if (error) { toast.error(error.message); hasError = true; break; }
    }

    if (!hasError) toast.success("Attendance saved");
    setSaving(false);
  };

  const summary = {
    present: studentAttendance.filter((s) => s.status === "present").length,
    absent: studentAttendance.filter((s) => s.status === "absent").length,
    leave: studentAttendance.filter((s) => s.status === "leave").length,
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Mark daily student attendance</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(""); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {filteredSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAttendance} className="w-full">Load Students</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceLoaded && (
        <>
          <div className="flex gap-4">
            <Badge variant="outline" className="bg-success/10 text-success">Present: {summary.present}</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">Absent: {summary.absent}</Badge>
            <Badge variant="outline" className="bg-warning/10 text-warning">Leave: {summary.leave}</Badge>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Adm No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentAttendance.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No students in selected class</TableCell></TableRow>
                ) : (
                  studentAttendance.map((s, i) => (
                    <TableRow key={s.studentId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{s.admissionNumber}</TableCell>
                      <TableCell className="font-medium">{s.studentName}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant={s.status === "present" ? "default" : "outline"}
                            className={s.status === "present" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
                            onClick={() => toggleStatus(i, "present")}>
                            <Check className="h-3 w-3 mr-1" /> P
                          </Button>
                          <Button size="sm" variant={s.status === "absent" ? "default" : "outline"}
                            className={s.status === "absent" ? "bg-destructive hover:bg-destructive/90" : ""}
                            onClick={() => toggleStatus(i, "absent")}>
                            <X className="h-3 w-3 mr-1" /> A
                          </Button>
                          <Button size="sm" variant={s.status === "leave" ? "default" : "outline"}
                            className={s.status === "leave" ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}
                            onClick={() => toggleStatus(i, "leave")}>
                            <Clock className="h-3 w-3 mr-1" /> L
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {studentAttendance.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={saveAttendance} disabled={saving} size="lg">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Attendance
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
