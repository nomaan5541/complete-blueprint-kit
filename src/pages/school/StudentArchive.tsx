import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Archive, Eye, GraduationCap, ClipboardCheck, FileText, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function StudentArchive() {
  const { schoolId } = useSchool();
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [historyMarks, setHistoryMarks] = useState<any[]>([]);
  const [historyAttendance, setHistoryAttendance] = useState<any[]>([]);
  const [historyFees, setHistoryFees] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [yRes, cRes, sRes] = await Promise.all([
        supabase.from("academic_years").select("*").eq("school_id", schoolId!).order("start_date", { ascending: false }),
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("students").select("*, classes(name), sections(name), academic_years(name)")
          .eq("school_id", schoolId!)
          .in("status", ["promoted", "transferred", "left", "inactive", "completed"])
          .order("name"),
      ]);
      setAcademicYears(yRes.data || []);
      setClasses(cRes.data || []);
      setStudents(sRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const openDetail = async (student: any) => {
    setSelectedStudent(student);
    setDetailOpen(true);
    setDetailLoading(true);

    // Find all records for this student by admission_number (across years)
    const { data: allRecords } = await supabase
      .from("students")
      .select("*, classes(name), sections(name), academic_years(name)")
      .eq("school_id", schoolId!)
      .eq("admission_number", student.admission_number)
      .order("created_at", { ascending: false });
    setStudentHistory(allRecords || []);

    const studentIds = (allRecords || []).map(r => r.id);

    if (studentIds.length > 0) {
      const [mRes, aRes, fRes] = await Promise.all([
        supabase.from("exam_marks").select("*, subjects(name), exams(name, exam_type)").in("student_id", studentIds),
        supabase.from("attendance").select("student_id, status, date, academic_year_id").in("student_id", studentIds),
        supabase.from("fee_payments").select("*, fee_types(name)").in("student_id", studentIds).order("payment_date", { ascending: false }),
      ]);
      setHistoryMarks(mRes.data || []);
      setHistoryAttendance(aRes.data || []);
      setHistoryFees(fRes.data || []);
    } else {
      setHistoryMarks([]);
      setHistoryAttendance([]);
      setHistoryFees([]);
    }
    setDetailLoading(false);
  };

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.admission_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (yearFilter !== "all" && s.academic_year_id !== yearFilter) return false;
    if (classFilter !== "all" && s.class_id !== classFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "promoted": return "default";
      case "transferred": return "secondary";
      case "left": return "destructive";
      default: return "outline";
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Archive className="h-8 w-8" /> Student Archive</h1>
        <p className="text-muted-foreground">View all previous student records — promoted, transferred & left students</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name or Adm No." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Academic Year</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="promoted">Promoted</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Archived Students ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No archived students found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adm No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.classes?.name}{s.sections?.name ? ` - ${s.sections.name}` : ""}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.academic_years?.name || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(s.status)}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(s)}>
                        <Eye className="mr-1 h-4 w-4" /> View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedStudent?.name} — Full History
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading history...</div>
          ) : (
            <Tabs defaultValue="timeline" className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="marks">Marks</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-3 mt-4">
                {studentHistory.map((rec, i) => (
                  <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {studentHistory.length - i}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{rec.classes?.name}{rec.sections?.name ? ` - ${rec.sections.name}` : ""}</p>
                      <p className="text-sm text-muted-foreground">{rec.academic_years?.name}</p>
                    </div>
                    <Badge variant={statusColor(rec.status)}>{rec.status}</Badge>
                  </div>
                ))}
              </TabsContent>

              {/* Marks Tab */}
              <TabsContent value="marks" className="mt-4">
                {historyMarks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No exam records</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Marks</TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyMarks.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>{m.exams?.name || "—"}</TableCell>
                          <TableCell>{m.subjects?.name || "—"}</TableCell>
                          <TableCell className="text-right">{m.marks_obtained ?? "—"}</TableCell>
                          <TableCell className="text-right">{m.max_marks}</TableCell>
                          <TableCell>{m.grade || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="mt-4">
                {historyAttendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No attendance records</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary per year */}
                    {studentHistory.map(rec => {
                      const yearAtt = historyAttendance.filter(a => a.student_id === rec.id);
                      const present = yearAtt.filter(a => a.status === "present").length;
                      const total = yearAtt.length;
                      const pct = total > 0 ? ((present / total) * 100).toFixed(1) : "0";
                      if (total === 0) return null;
                      return (
                        <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{rec.classes?.name} — {rec.academic_years?.name}</p>
                            <p className="text-xs text-muted-foreground">{present} present / {total} days</p>
                          </div>
                          <Badge variant={Number(pct) >= 75 ? "default" : "destructive"}>{pct}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="mt-4">
                {historyFees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No fee records</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyFees.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="text-sm">{format(new Date(f.payment_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>{f.fee_types?.name || "—"}</TableCell>
                          <TableCell className="text-right font-medium">₹{Number(f.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{f.receipt_number || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
