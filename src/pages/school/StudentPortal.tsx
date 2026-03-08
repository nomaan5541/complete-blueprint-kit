import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ClipboardCheck, FileText, IndianRupee, Bell, Calendar, AlertCircle, Monitor, PlayCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function StudentPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      // Get profile to find school
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      setProfile(prof);
      if (!prof?.school_id) { setLoading(false); return; }

      // Find student record linked to this user
      const { data: stud } = await supabase.from("students").select("*, classes(name), sections(name), academic_years(name)")
        .eq("user_id", user!.id).eq("status", "active").maybeSingle();
      setStudent(stud);
      if (!stud) { setLoading(false); return; }

      // Fetch all data
      const results = await Promise.all([
        supabase.from("attendance").select("*").eq("student_id", stud.id).order("date", { ascending: false }).limit(60),
        supabase.from("exam_marks").select("*, subjects(name), exams(name)").eq("student_id", stud.id),
        supabase.from("fee_payments").select("*, fee_types(name)").eq("student_id", stud.id).order("payment_date", { ascending: false }),
        supabase.from("notifications").select("*").eq("school_id", prof.school_id).order("created_at", { ascending: false }).limit(20),
        stud.class_id ? supabase.from("timetable_entries").select("*, subjects(name), teachers(name), timetable_slots(name, start_time, end_time, slot_order, is_break)").eq("class_id", stud.class_id) : Promise.resolve({ data: [] }),
        supabase.from("timetable_slots").select("*").eq("school_id", prof.school_id).order("slot_order"),
        stud.class_id ? supabase.from("fee_structures").select("*, fee_types(name)").eq("school_id", prof.school_id).eq("class_id", stud.class_id).eq("academic_year_id", stud.academic_year_id) : Promise.resolve({ data: [] }),
        stud.class_id ? supabase.from("exams").select("*, subjects(name)").eq("school_id", prof.school_id).eq("class_id", stud.class_id) : Promise.resolve({ data: [] }),
        supabase.from("student_exam_attempts" as any).select("*").eq("student_id", stud.id),
        stud.class_id ? supabase.from("homework" as any).select("*, subjects(name), teachers(name)").eq("class_id", stud.class_id).eq("school_id", prof.school_id).eq("status", "active").order("due_date", { ascending: true }) : Promise.resolve({ data: [] }),
      ]);

      setAttendance((results[0] as any).data || []);
      setMarks((results[1] as any).data || []);
      setFees((results[2] as any).data || []);
      setNotifications((results[3] as any).data || []);
      setTimetable((results[4] as any).data || []);
      setSlots((results[5] as any).data || []);
      setFeeStructures((results[6] as any).data || []);
      setOnlineExams((results[7] as any).data || []);
      setAttempts((results[8] as any).data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md"><CardContent className="pt-6 text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No student record found</p>
        <p className="text-sm text-muted-foreground mt-2">Your account is not linked to a student record yet. Please contact your school admin.</p>
      </CardContent></Card>
    </div>
  );

  const presentDays = attendance.filter((a) => a.status === "present").length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";
  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);

  // Calculate fee dues
  const feeDues = feeStructures.map((fs: any) => {
    const paid = fees.filter((f: any) => f.fee_type_id === fs.fee_type_id).reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const due = Number(fs.amount) - paid;
    return { ...fs, paid, due: due > 0 ? due : 0 };
  });
  const totalDue = feeDues.reduce((sum, d) => sum + d.due, 0);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {student.name}</h1>
        <p className="text-muted-foreground">
          {student.classes?.name} {student.sections?.name ? `- Section ${student.sections.name}` : ""} · {student.academic_years?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-success" /><p className="text-xl font-bold">{attendanceRate}%</p><p className="text-xs text-muted-foreground">Attendance</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{marks.length}</p><p className="text-xs text-muted-foreground">Exam Records</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><IndianRupee className="h-5 w-5 mx-auto mb-1 text-warning" /><p className="text-xl font-bold">₹{totalDue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Fee Due</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Bell className="h-5 w-5 mx-auto mb-1" /><p className="text-xl font-bold">{notifications.length}</p><p className="text-xs text-muted-foreground">Notices</p></CardContent></Card>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="dues">Fee Dues</TabsTrigger>
          <TabsTrigger value="fees">Payments</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="online-exams"><Monitor className="mr-1 h-3 w-3" /> Online Exams</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <D label="Admission No" value={student.admission_number} />
              <D label="Name" value={student.name} />
              <D label="Gender" value={student.gender} />
              <D label="Date of Birth" value={student.date_of_birth} />
              <D label="Blood Group" value={student.blood_group} />
              <D label="Father" value={student.father_name} />
              <D label="Mother" value={student.mother_name} />
              <D label="Father Phone" value={student.father_phone} />
              <D label="Class" value={student.classes?.name} />
              <D label="Section" value={student.sections?.name} />
              <D label="Status" value={student.status} />
              {student.address && <div className="col-span-2"><D label="Address" value={[student.address, student.city, student.state, student.pincode].filter(Boolean).join(", ")} /></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle>Attendance (Last 60 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="bg-success/10 text-success">Present: {presentDays}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive">Absent: {attendance.filter(a => a.status === "absent").length}</Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning">Leave: {attendance.filter(a => a.status === "leave").length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {attendance.map((a) => (
                  <div key={a.id} title={`${a.date}: ${a.status}`}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center ${a.status === "present" ? "bg-success/20 text-success" : a.status === "absent" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                    {a.status[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <Card>
            <CardHeader><CardTitle>Exam Results</CardTitle></CardHeader>
            <CardContent>
              {marks.length === 0 ? <p className="text-muted-foreground text-center py-8">No exam results yet</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Max</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {marks.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.exams?.name || "—"}</TableCell>
                        <TableCell>{m.subjects?.name || "—"}</TableCell>
                        <TableCell className="font-medium">{m.marks_obtained}</TableCell>
                        <TableCell>{m.max_marks}</TableCell>
                        <TableCell>{m.max_marks > 0 ? ((m.marks_obtained / m.max_marks) * 100).toFixed(0) + "%" : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Fee Dues
                {totalDue > 0 && <Badge variant="destructive" className="text-xs">₹{totalDue.toLocaleString()} pending</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feeDues.length === 0 ? <p className="text-muted-foreground text-center py-8">No fee structure assigned for your class</p> : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeDues.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.fee_types?.name || "—"}</TableCell>
                          <TableCell className="text-right">₹{Number(d.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{d.paid.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{d.due > 0 ? `₹${d.due.toLocaleString()}` : "—"}</TableCell>
                          <TableCell>
                            {d.due === 0 ? (
                              <Badge variant="outline" className="bg-success/10 text-success">Paid</Badge>
                            ) : d.paid > 0 ? (
                              <Badge variant="outline" className="bg-warning/10 text-warning">Partial</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive">Unpaid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalDue > 0 && (
                    <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span>Total pending dues: <strong>₹{totalDue.toLocaleString()}</strong>. Please contact your school office for payment.</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader><CardTitle>Fee History</CardTitle></CardHeader>
            <CardContent>
              {fees.length === 0 ? <p className="text-muted-foreground text-center py-8">No fee records</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fees.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.receipt_number || "—"}</TableCell>
                        <TableCell>{f.fee_types?.name || "—"}</TableCell>
                        <TableCell className="font-medium">₹{Number(f.amount).toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{f.payment_mode || "—"}</TableCell>
                        <TableCell>{format(new Date(f.payment_date), "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardHeader><CardTitle>My Timetable</CardTitle></CardHeader>
            <CardContent>
              {timetable.length === 0 ? <p className="text-muted-foreground text-center py-8">Timetable not set yet</p> : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Time</TableHead>
                        {DAYS.map((d) => <TableHead key={d}>{d}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id} className={slot.is_break ? "bg-muted/30" : ""}>
                          <TableCell className="font-medium text-xs">{slot.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{slot.start_time?.slice(0, 5)}-{slot.end_time?.slice(0, 5)}</TableCell>
                          {DAYS.map((_, di) => {
                            const entry = timetable.find((e) => e.timetable_slots?.slot_order === slot.slot_order && e.day_of_week === di);
                            return <TableCell key={di} className="text-xs">{slot.is_break ? "—" : entry?.subjects?.name || "—"}</TableCell>;
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online-exams">
          <Card>
            <CardHeader><CardTitle>Online Exams</CardTitle></CardHeader>
            <CardContent>
              {onlineExams.filter((e: any) => (e as any).exam_mode === "online").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No online exams available</p>
              ) : (
                <div className="space-y-3">
                  {onlineExams.filter((e: any) => (e as any).exam_mode === "online").map((exam: any) => {
                    const attempt = attempts.find((a: any) => a.exam_id === exam.id);
                    const isCompleted = attempt?.status === "completed";
                    return (
                      <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{exam.name}</p>
                          <p className="text-sm text-muted-foreground">{exam.subjects?.name} · {(exam as any).total_marks} marks · {(exam as any).duration_minutes} min</p>
                        </div>
                        {isCompleted ? (
                          <Badge variant="outline" className="bg-success/10 text-success">Score: {attempt.score}</Badge>
                        ) : (
                          <Button size="sm" onClick={() => navigate(`/student/exam?examId=${exam.id}`)}>
                            <PlayCircle className="mr-1 h-4 w-4" /> Take Exam
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices">
          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? <p className="text-muted-foreground text-center py-8">No notifications</p> : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{n.type}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd MMM yyyy")}</span>
                    </div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function D({ label, value }: { label: string; value?: string | null }) {
  return <div><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value || "—"}</span></div>;
}
