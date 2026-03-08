import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IndianRupee, AlertTriangle, CheckCircle } from "lucide-react";

interface StudentDue {
  id: string;
  name: string;
  admission_number: string;
  className: string;
  totalFee: number;
  totalPaid: number;
  due: number;
}

export default function FeeDues() {
  const { schoolId } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, cRes, yRes] = await Promise.all([
        supabase.from("students").select("id, name, admission_number, class_id, classes(name)").eq("school_id", schoolId!).eq("status", "active").order("name"),
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("academic_years").select("*").eq("school_id", schoolId!).eq("status", "active"),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
      setAcademicYears(yRes.data || []);
      if (yRes.data?.[0]) setSelectedYear(yRes.data[0].id);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !selectedYear) return;
    Promise.all([
      supabase.from("fee_structures").select("*").eq("school_id", schoolId).eq("academic_year_id", selectedYear),
      supabase.from("fee_payments").select("student_id, amount").eq("school_id", schoolId).eq("academic_year_id", selectedYear),
    ]).then(([fsRes, fpRes]) => {
      setFeeStructures(fsRes.data || []);
      setFeePayments(fpRes.data || []);
    });
  }, [schoolId, selectedYear]);

  // Calculate dues per student
  const studentDues: StudentDue[] = students.map(s => {
    const totalFee = feeStructures.filter(fs => fs.class_id === s.class_id).reduce((sum, fs) => sum + Number(fs.amount), 0);
    const totalPaid = feePayments.filter(fp => fp.student_id === s.id).reduce((sum, fp) => sum + Number(fp.amount), 0);
    return {
      id: s.id,
      name: s.name,
      admission_number: s.admission_number,
      className: s.classes?.name || "—",
      totalFee,
      totalPaid,
      due: totalFee - totalPaid,
    };
  }).filter(s => classFilter === "all" || students.find(st => st.id === s.id)?.class_id === classFilter);

  const totalDue = studentDues.reduce((sum, s) => sum + Math.max(0, s.due), 0);
  const totalCollected = studentDues.reduce((sum, s) => sum + s.totalPaid, 0);
  const studentsWithDues = studentDues.filter(s => s.due > 0).length;

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fee Dues & Pending</h1>
        <p className="text-muted-foreground">Track student fee dues and pending payments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6 text-center">
          <IndianRupee className="h-5 w-5 mx-auto mb-1 text-success" />
          <p className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Collected</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">₹{totalDue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Pending</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold">{studentsWithDues}</p>
          <p className="text-xs text-muted-foreground">Students with Dues</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1">
          <Label>Academic Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adm No.</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Total Fee</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentDues.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No students</TableCell></TableRow>
            ) : (
              studentDues.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>₹{s.totalFee.toLocaleString()}</TableCell>
                  <TableCell>₹{s.totalPaid.toLocaleString()}</TableCell>
                  <TableCell className={s.due > 0 ? "text-destructive font-medium" : "text-success"}>
                    ₹{Math.max(0, s.due).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {s.due <= 0 ? (
                      <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
