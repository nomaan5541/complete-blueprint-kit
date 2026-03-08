import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, Layers, IndianRupee, ClipboardCheck, AlertCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { exportToCsv } from "@/lib/csvExport";

export default function SchoolDashboard() {
  const { schoolId } = useSchool();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, academicYears: 0 });
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, leave: 0 });
  const [feeStats, setFeeStats] = useState({ totalCollected: 0, thisMonth: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [pendingFeeStudents, setPendingFeeStudents] = useState(0);
  const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

      const [studentsRes, teachersRes, classesRes, yearsRes, attRes, feeRes, monthFeeRes, recentPayRes, recentAdmRes, examsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("academic_years").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("attendance").select("status").eq("school_id", schoolId!).eq("date", today),
        supabase.from("fee_payments").select("amount, payment_date").eq("school_id", schoolId!),
        supabase.from("fee_payments").select("amount").eq("school_id", schoolId!).gte("payment_date", monthStart),
        supabase.from("fee_payments").select("*, students(name, admission_number), fee_types(name)").eq("school_id", schoolId!).order("payment_date", { ascending: false }).limit(5),
        supabase.from("students").select("name, admission_number, classes(name), created_at").eq("school_id", schoolId!).eq("status", "active").order("created_at", { ascending: false }).limit(5),
        supabase.from("exams").select("name, exam_type, start_date, academic_years(name)").eq("school_id", schoolId!).gte("start_date", today).order("start_date").limit(5),
      ]);

      const totalStudents = studentsRes.count ?? 0;
      setStats({
        students: totalStudents,
        teachers: teachersRes.count ?? 0,
        classes: classesRes.count ?? 0,
        academicYears: yearsRes.count ?? 0,
      });

      const attData = attRes.data || [];
      setTodayAttendance({
        present: attData.filter(a => a.status === "present").length,
        absent: attData.filter(a => a.status === "absent").length,
        leave: attData.filter(a => a.status === "leave").length,
      });

      const allFees = feeRes.data || [];
      const totalCollected = allFees.reduce((sum, p) => sum + Number(p.amount), 0);
      const thisMonth = (monthFeeRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      setFeeStats({ totalCollected, thisMonth });
      setRecentPayments(recentPayRes.data || []);
      setRecentAdmissions(recentAdmRes.data || []);
      setUpcomingExams(examsRes.data || []);

      // Monthly fee trends (last 6 months)
      const monthlyData: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const label = format(d, "MMM yy");
        const start = format(startOfMonth(d), "yyyy-MM-dd");
        const end = format(endOfMonth(d), "yyyy-MM-dd");
        const total = allFees
          .filter(f => f.payment_date >= start && f.payment_date <= end + "T23:59:59")
          .reduce((s, f) => s + Number(f.amount), 0);
        monthlyData.push({ month: label, amount: total });
      }
      setMonthlyFees(monthlyData);

      // Weekly attendance (last 7 school days)
      const { data: weekAtt } = await supabase.from("attendance").select("date, status").eq("school_id", schoolId!).gte("date", format(subMonths(new Date(), 1), "yyyy-MM-dd")).order("date", { ascending: false }).limit(1000);
      const dayMap: Record<string, { present: number; absent: number; total: number }> = {};
      (weekAtt || []).forEach(a => {
        if (!dayMap[a.date]) dayMap[a.date] = { present: 0, absent: 0, total: 0 };
        dayMap[a.date].total++;
        if (a.status === "present") dayMap[a.date].present++;
        else if (a.status === "absent") dayMap[a.date].absent++;
      });
      const sortedDays = Object.entries(dayMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).reverse();
      setWeeklyAttendance(sortedDays.map(([date, d]) => ({
        date: format(new Date(date), "dd MMM"),
        rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
        present: d.present,
        absent: d.absent,
      })));

      // Pending fees
      const { data: paidStudents } = await supabase.from("fee_payments").select("student_id").eq("school_id", schoolId!);
      const paidStudentIds = new Set((paidStudents || []).map(p => p.student_id));
      setPendingFeeStudents(Math.max(0, totalStudents - paidStudentIds.size));

      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">School Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your school — {format(new Date(), "dd MMM yyyy")}</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Active Students" value={loading ? "..." : stats.students} icon={GraduationCap} />
        <StatsCard title="Active Teachers" value={loading ? "..." : stats.teachers} icon={Users} />
        <StatsCard title="Classes" value={loading ? "..." : stats.classes} icon={Layers} />
        <StatsCard title="Pending Fees" value={loading ? "..." : pendingFeeStudents} icon={AlertCircle} description="Students with no payments" />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Attendance */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Today's Attendance</CardTitle></CardHeader>
          <CardContent>
            {todayAttendance.present + todayAttendance.absent + todayAttendance.leave === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance marked today</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-success/10 text-success text-xs">Present: {todayAttendance.present}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">Absent: {todayAttendance.absent}</Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning text-xs">Leave: {todayAttendance.leave}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Collection */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Fee Collection</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">₹{feeStats.thisMonth.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="text-xs text-muted-foreground">Total: ₹{feeStats.totalCollected.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Upcoming Exams</CardTitle></CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams</p>
            ) : (
              <div className="space-y-2">
                {upcomingExams.map((e, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate font-medium">{e.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{e.start_date}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fee Collection Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Fee Collection Trend (6 months)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportToCsv("fee-trend", monthlyFees)}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyFees.some(m => m.amount > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyFees}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" fontSize={12} className="fill-muted-foreground" />
                  <YAxis fontSize={12} className="fill-muted-foreground" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Collection"]} />
                  <Line type="monotone" dataKey="amount" className="stroke-primary" strokeWidth={2.5} dot={{ r: 4, className: "fill-primary" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No fee data available</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Attendance Trend (Recent Days)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportToCsv("attendance-trend", weeklyAttendance)}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} fontSize={12} className="fill-muted-foreground" tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number, name: string) => [name === "rate" ? `${v}%` : v, name === "rate" ? "Attendance Rate" : name]} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {weeklyAttendance.map((entry, i) => (
                      <Cell key={i} className={entry.rate >= 80 ? "fill-success" : entry.rate >= 60 ? "fill-warning" : "fill-destructive"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No attendance data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{p.students?.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.fee_types?.name})</span>
                    </div>
                    <span className="font-medium text-primary">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Admitted Students */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recently Admitted</CardTitle></CardHeader>
          <CardContent>
            {recentAdmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent admissions</p>
            ) : (
              <div className="space-y-2">
                {recentAdmissions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.admission_number}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{s.classes?.name || "—"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
