import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/StatsCard";
import { School, Users, GraduationCap, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface Stats {
  totalSchools: number;
  activeSchools: number;
  expiredSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSchools: 0, activeSchools: 0, expiredSchools: 0,
    totalStudents: 0, totalTeachers: 0, totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [schoolsRes, paymentsRes] = await Promise.all([
        supabase.from("schools").select("id, status"),
        supabase.from("payment_history").select("amount, status"),
      ]);

      const schools = schoolsRes.data || [];
      const payments = paymentsRes.data || [];

      setStats({
        totalSchools: schools.length,
        activeSchools: schools.filter((s) => s.status === "active").length,
        expiredSchools: schools.filter((s) => s.status === "expired").length,
        totalStudents: 0,
        totalTeachers: 0,
        totalRevenue: payments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + Number(p.amount), 0),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to EduManage Super Admin Panel</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Schools" value={loading ? "..." : stats.totalSchools} icon={School} />
        <StatsCard title="Active Schools" value={loading ? "..." : stats.activeSchools} icon={CheckCircle} />
        <StatsCard title="Expired Schools" value={loading ? "..." : stats.expiredSchools} icon={AlertTriangle} />
        <StatsCard title="Total Students" value={loading ? "..." : stats.totalStudents} icon={GraduationCap} description="Across all schools" />
        <StatsCard title="Total Teachers" value={loading ? "..." : stats.totalTeachers} icon={Users} description="Across all schools" />
        <StatsCard title="Total Revenue" value={loading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>
    </div>
  );
}
