import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 70%, 50%)"];

export default function SchoolReports() {
  const { schoolId } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, cRes, fRes, aRes] = await Promise.all([
        supabase.from("students").select("id, name, class_id, status, classes(name)").eq("school_id", schoolId!),
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("fee_payments").select("amount, payment_date, fee_types(name)").eq("school_id", schoolId!).order("payment_date", { ascending: false }).limit(500),
        supabase.from("attendance").select("status, date").eq("school_id", schoolId!).limit(1000),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
      setFeePayments(fRes.data || []);
      setAttendance(aRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  // Student stats
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "active").length;
  const classWise = classes.map((c) => ({
    name: c.name,
    count: students.filter((s) => s.class_id === c.id).length,
  }));

  // Fee stats
  const totalCollected = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const feeByType = feePayments.reduce((acc: Record<string, number>, p: any) => {
    const name = p.fee_types?.name || "Other";
    acc[name] = (acc[name] || 0) + Number(p.amount);
    return acc;
  }, {});
  const feeChartData = Object.entries(feeByType).map(([name, value]) => ({ name, value }));

  // Attendance stats
  const totalRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const leaveCount = attendance.filter((a) => a.status === "leave").length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0";

  const attendancePie = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
    { name: "Leave", value: leaveCount },
  ].filter((d) => d.value > 0);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">School analytics and reports</p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{totalStudents}</p><p className="text-sm text-muted-foreground">Total Students</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">{activeStudents}</p><p className="text-sm text-muted-foreground">Active Students</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{classes.length}</p><p className="text-sm text-muted-foreground">Total Classes</p></CardContent></Card>
          </div>
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
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">₹{totalCollected.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Collected</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{feePayments.length}</p><p className="text-sm text-muted-foreground">Total Payments</p></CardContent></Card>
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
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-success">{attendanceRate}%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{totalRecords}</p><p className="text-sm text-muted-foreground">Total Records</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-destructive">{absentCount}</p><p className="text-sm text-muted-foreground">Absent Records</p></CardContent></Card>
          </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
