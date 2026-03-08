import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/csvExport";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 70%, 50%)"];

export default function SchoolReports() {
  const { schoolId } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, cRes, fRes, fsRes, aRes, mRes, subRes, eRes, tRes, taRes] = await Promise.all([
        supabase.from("students").select("id, name, class_id, status, admission_date, classes(name)").eq("school_id", schoolId!),
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("fee_payments").select("amount, payment_date, student_id, fee_types(name)").eq("school_id", schoolId!).order("payment_date", { ascending: false }).limit(500),
        supabase.from("fee_structures").select("amount, class_id").eq("school_id", schoolId!),
        supabase.from("attendance").select("status, date, class_id, student_id").eq("school_id", schoolId!).limit(1000),
        supabase.from("exam_marks").select("marks_obtained, max_marks, student_id, subject_id, exam_id, class_id").eq("school_id", schoolId!),
        supabase.from("subjects").select("id, name").eq("school_id", schoolId!),
        supabase.from("exams").select("id, name").eq("school_id", schoolId!),
        supabase.from("teachers").select("id, name, status").eq("school_id", schoolId!),
        supabase.from("teacher_assignments").select("teacher_id, class_id, subject_id").eq("school_id", schoolId!),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
      setFeePayments(fRes.data || []);
      setFeeStructures(fsRes.data || []);
      setAttendance(aRes.data || []);
      setExamMarks(mRes.data || []);
      setSubjects(subRes.data || []);
      setExams(eRes.data || []);
      setTeachers(tRes.data || []);
      setTeacherAssignments(taRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  // Student stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "active").length;
  const classWise = classes.map(c => ({
    name: c.name,
    count: students.filter(s => s.class_id === c.id && s.status === "active").length,
  }));
  const statusDist = ["active", "promoted", "transferred", "left", "completed"].map(st => ({
    name: st, value: students.filter(s => s.status === st).length,
  })).filter(d => d.value > 0);

  // Fee stats
  const totalCollected = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpected = students.filter(s => s.status === "active").reduce((sum, s) => {
    return sum + feeStructures.filter(fs => fs.class_id === s.class_id).reduce((a, fs) => a + Number(fs.amount), 0);
  }, 0);
  const feeByType = feePayments.reduce((acc: Record<string, number>, p: any) => {
    const name = p.fee_types?.name || "Other";
    acc[name] = (acc[name] || 0) + Number(p.amount);
    return acc;
  }, {});
  const feeChartData = Object.entries(feeByType).map(([name, value]) => ({ name, value }));

  // Attendance stats
  const totalRecords = attendance.length;
  const presentCount = attendance.filter(a => a.status === "present").length;
  const absentCount = attendance.filter(a => a.status === "absent").length;
  const leaveCount = attendance.filter(a => a.status === "leave").length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0";

  // Class-wise attendance
  const classAttendance = classes.map(c => {
    const records = attendance.filter(a => a.class_id === c.id);
    const present = records.filter(a => a.status === "present").length;
    const rate = records.length > 0 ? ((present / records.length) * 100).toFixed(0) : "0";
    return { name: c.name, rate: Number(rate), total: records.length };
  }).filter(c => c.total > 0);

  // Exam analytics - subject averages
  const subjectAvg = subjects.map(sub => {
    const marks = examMarks.filter(m => m.subject_id === sub.id && m.marks_obtained != null);
    const avg = marks.length > 0 ? marks.reduce((s, m) => s + (Number(m.marks_obtained) / Number(m.max_marks)) * 100, 0) / marks.length : 0;
    return { name: sub.name, average: Number(avg.toFixed(1)) };
  }).filter(s => s.average > 0);

  // Teacher workload
  const teacherWorkload = teachers.filter(t => t.status === "active").map(t => {
    const assignments = teacherAssignments.filter(a => a.teacher_id === t.id);
    const uniqueClasses = new Set(assignments.map(a => a.class_id)).size;
    const uniqueSubjects = new Set(assignments.map(a => a.subject_id)).size;
    return { name: t.name, classes: uniqueClasses, subjects: uniqueSubjects, total: assignments.length };
  }).sort((a, b) => b.total - a.total);

  const attendancePie = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
    { name: "Leave", value: leaveCount },
  ].filter(d => d.value > 0);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive school analytics and reports</p>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="flex-wrap">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exam Analytics</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportToCsv("students", students.map(s => ({ name: s.name, class: (s as any).classes?.name, status: s.status, admission_date: s.admission_date })))}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{totalStudents}</p><p className="text-sm text-muted-foreground">Total Students</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">{activeStudents}</p><p className="text-sm text-muted-foreground">Active Students</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{classes.length}</p><p className="text-sm text-muted-foreground">Total Classes</p></CardContent></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {classWise.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Students by Class</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classWise}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {statusDist.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Student Status Distribution</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportToCsv("fee-payments", feePayments.map(p => ({ amount: p.amount, date: p.payment_date, type: (p as any).fee_types?.name })))}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">₹{totalCollected.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Collected</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">₹{totalExpected.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Expected</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-destructive">₹{Math.max(0, totalExpected - totalCollected).toLocaleString()}</p><p className="text-sm text-muted-foreground">Pending Fees</p></CardContent></Card>
          </div>
          {feeChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Collection by Fee Type</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={feeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {feeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">{attendanceRate}%</p><p className="text-sm text-muted-foreground">Overall Rate</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{totalRecords}</p><p className="text-sm text-muted-foreground">Total Records</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-destructive">{absentCount}</p><p className="text-sm text-muted-foreground">Absent Records</p></CardContent></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {attendancePie.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Attendance Distribution</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        <Cell fill="hsl(142, 71%, 45%)" />
                        <Cell fill="hsl(0, 84%, 60%)" />
                        <Cell fill="hsl(38, 92%, 50%)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {classAttendance.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Class-wise Attendance Rate (%)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classAttendance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="rate" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          {subjectAvg.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Subject-wise Average Score (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={subjectAvg} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="average" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">No exam data available</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Teacher Workload</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Total Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherWorkload.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No assignments</TableCell></TableRow>
                  ) : (
                    teacherWorkload.map(t => (
                      <TableRow key={t.name}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.classes}</TableCell>
                        <TableCell>{t.subjects}</TableCell>
                        <TableCell><Badge variant="secondary">{t.total}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
