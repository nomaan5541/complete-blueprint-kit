import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Calendar, Layers, IndianRupee, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

export default function SchoolDashboard() {
  const { schoolId } = useSchool();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, academicYears: 0 });
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, leave: 0 });
  const [feeStats, setFeeStats] = useState({ totalCollected: 0, thisMonth: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

      const [studentsRes, teachersRes, classesRes, yearsRes, attRes, feeRes, monthFeeRes, recentRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("academic_years").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("attendance").select("status").eq("school_id", schoolId!).eq("date", today),
        supabase.from("fee_payments").select("amount").eq("school_id", schoolId!),
        supabase.from("fee_payments").select("amount").eq("school_id", schoolId!).gte("payment_date", monthStart),
        supabase.from("fee_payments").select("*, students(name, admission_number), fee_types(name)").eq("school_id", schoolId!).order("payment_date", { ascending: false }).limit(5),
      ]);

      setStats({
        students: studentsRes.count ?? 0,
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

      const totalCollected = (feeRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const thisMonth = (monthFeeRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      setFeeStats({ totalCollected, thisMonth });
      setRecentPayments(recentRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school — {format(new Date(), "dd MMM yyyy")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Active Students" value={loading ? "..." : stats.students} icon={GraduationCap} />
        <StatsCard title="Active Teachers" value={loading ? "..." : stats.teachers} icon={Users} />
        <StatsCard title="Classes" value={loading ? "..." : stats.classes} icon={Layers} />
        <StatsCard title="Academic Years" value={loading ? "..." : stats.academicYears} icon={Calendar} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Today's Attendance</CardTitle></CardHeader>
          <CardContent>
            {todayAttendance.present + todayAttendance.absent + todayAttendance.leave === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance marked today</p>
            ) : (
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-success/10 text-success">Present: {todayAttendance.present}</Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive">Absent: {todayAttendance.absent}</Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning">Leave: {todayAttendance.leave}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Fee Collection</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">₹{feeStats.thisMonth.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="text-xs text-muted-foreground">Total: ₹{feeStats.totalCollected.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="truncate">{p.students?.name}</span>
                    <span className="font-medium text-primary">₹{Number(p.amount).toLocaleString()}</span>
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
