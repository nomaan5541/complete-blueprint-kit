import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GraduationCap, IndianRupee, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

export default function StudentProfile() {
  const { schoolId } = useSchool();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<any>(null);
  const [master, setMaster] = useState<any>(null);
  const [yearRecords, setYearRecords] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !studentId) return;
    async function fetch() {
      // Get current student year record
      const { data: s } = await supabase.from("students")
        .select("*, classes(name), sections(name), academic_years(name)")
        .eq("id", studentId!).single();
      setStudent(s);
      if (!s) { setLoading(false); return; }

      // Get master record for permanent data
      let masterData = null;
      if (s.student_master_id) {
        const { data: m } = await supabase.from("student_master" as any)
          .select("*").eq("id", s.student_master_id).single();
        masterData = m;
      }
      setMaster(masterData);

      // Get all year records for this student (via master_id or admission_number)
      const yearQuery = s.student_master_id
        ? supabase.from("students").select("id, name, admission_number, status, class_id, section_id, academic_year_id, classes(name), sections(name), academic_years(name)")
            .eq("school_id", schoolId!).eq("student_master_id", s.student_master_id).order("created_at", { ascending: false })
        : supabase.from("students").select("id, name, admission_number, status, class_id, section_id, academic_year_id, classes(name), sections(name), academic_years(name)")
            .eq("school_id", schoolId!).eq("admission_number", s.admission_number).order("created_at", { ascending: false });

      const [histRes, feeRes, attRes, marksRes, fsRes] = await Promise.all([
        yearQuery,
        supabase.from("fee_payments").select("*, fee_types(name), academic_years(name)")
          .eq("student_id", studentId!).order("payment_date", { ascending: false }),
        supabase.from("attendance").select("date, status")
          .eq("student_id", studentId!).order("date", { ascending: false }).limit(100),
        supabase.from("exam_marks").select("*, exams(name), subjects(name)")
          .eq("student_id", studentId!),
        supabase.from("fee_structures").select("*, fee_types(name)")
          .eq("class_id", s.class_id).eq("academic_year_id", s.academic_year_id),
      ]);

      setYearRecords(histRes.data || []);
      setFeePayments(feeRes.data || []);
      setAttendance(attRes.data || []);
      setExamMarks(marksRes.data || []);
      setFeeStructures(fsRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId, studentId]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="p-10 text-center text-muted-foreground">Student not found</div>;

  // Use master for personal info, fallback to student record
  const getField = (field: string) => master?.[field] || student[field];

  const totalFeeExpected = feeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0);
  const totalPaid = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const feeDue = totalFeeExpected - totalPaid;
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === "present").length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success", promoted: "bg-primary/10 text-primary",
    left: "bg-destructive/10 text-destructive", transferred: "bg-warning/10 text-warning",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/school/students")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{getField("name")}</h1>
          <p className="text-muted-foreground">Admission No: {getField("admission_number")}</p>
        </div>
        <Badge variant="outline" className={statusColor[student.status] || ""}>{student.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <GraduationCap className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{student.classes?.name || "—"}</p>
          <p className="text-xs text-muted-foreground">Current Class</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-success" />
          <p className="text-lg font-bold">{attendanceRate}%</p>
          <p className="text-xs text-muted-foreground">Attendance</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Paid</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-lg font-bold">₹{feeDue > 0 ? feeDue.toLocaleString() : "0"}</p>
          <p className="text-xs text-muted-foreground">Fee Due</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="history">Academic History</TabsTrigger>
          <TabsTrigger value="fees">Fee History</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exam Results</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              {master && <p className="text-xs text-muted-foreground">From permanent student record (Master ID)</p>}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Name" value={getField("name")} />
                <InfoItem label="Gender" value={getField("gender")} />
                <InfoItem label="Date of Birth" value={getField("date_of_birth")} />
                <InfoItem label="Blood Group" value={getField("blood_group")} />
                <InfoItem label="Father Name" value={getField("father_name")} />
                <InfoItem label="Mother Name" value={getField("mother_name")} />
                <InfoItem label="Father Phone" value={getField("father_phone")} />
                <InfoItem label="Address" value={[getField("address"), getField("city"), getField("state"), getField("pincode")].filter(Boolean).join(", ")} />
                <InfoItem label="Admission Date" value={getField("admission_date")} />
                <InfoItem label="Class" value={student.classes?.name} />
                <InfoItem label="Section" value={student.sections?.name} />
                <InfoItem label="Academic Year" value={student.academic_years?.name} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-base">Year-wise Academic History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearRecords.map((h) => (
                    <TableRow key={h.id} className={h.id === studentId ? "bg-primary/5" : ""}>
                      <TableCell>{h.academic_years?.name || "—"}</TableCell>
                      <TableCell>{h.classes?.name || "—"}</TableCell>
                      <TableCell>{h.sections?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColor[h.status] || ""}>{h.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {yearRecords.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No history</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Payments</CardTitle>
              {totalFeeExpected > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total: ₹{totalFeeExpected.toLocaleString()} · Paid: ₹{totalPaid.toLocaleString()} · Due: <span className={feeDue > 0 ? "text-destructive font-medium" : "text-success"}>₹{Math.max(0, feeDue).toLocaleString()}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feePayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.receipt_number || "—"}</TableCell>
                      <TableCell>{p.fee_types?.name || "—"}</TableCell>
                      <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary">{p.payment_mode}</Badge></TableCell>
                      <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {feePayments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No payments</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total: {totalDays} days · Present: {presentDays} · Absent: {attendance.filter(a => a.status === "absent").length} · Leave: {attendance.filter(a => a.status === "leave").length} · Rate: <span className="font-medium">{attendanceRate}%</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {attendance.slice(0, 60).map((a, i) => (
                  <div key={i} className={`text-center text-xs py-1 rounded ${a.status === "present" ? "bg-success/20 text-success" : a.status === "absent" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`} title={`${a.date}: ${a.status}`}>
                    {format(new Date(a.date), "dd")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader><CardTitle className="text-base">Exam Results</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examMarks.map((m) => {
                    const pct = m.max_marks > 0 ? ((m.marks_obtained / m.max_marks) * 100).toFixed(0) : "0";
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.exams?.name || "—"}</TableCell>
                        <TableCell>{m.subjects?.name || "—"}</TableCell>
                        <TableCell className="font-medium">{m.marks_obtained ?? "—"}</TableCell>
                        <TableCell>{m.max_marks}</TableCell>
                        <TableCell><Badge variant={Number(pct) >= 50 ? "default" : "destructive"}>{pct}%</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                  {examMarks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No exam results</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
