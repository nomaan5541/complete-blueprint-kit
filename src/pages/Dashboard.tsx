import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { School, Users, GraduationCap, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

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
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      const [schoolsRes, paymentsRes, studentsRes, teachersRes] = await Promise.all([
        supabase.from("schools").select("id, name, status, city, created_at, logo_url").order("created_at", { ascending: false }),
        supabase.from("payment_history").select("amount, status"),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
      ]);

      const schools = schoolsRes.data || [];
      const payments = paymentsRes.data || [];

      setStats({
        totalSchools: schools.length,
        activeSchools: schools.filter((s) => s.status === "active").length,
        expiredSchools: schools.filter((s) => s.status === "expired").length,
        totalStudents: studentsRes.count ?? 0,
        totalTeachers: teachersRes.count ?? 0,
        totalRevenue: payments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + Number(p.amount), 0),
      });
      setRecentSchools(schools.slice(0, 5));

      // School growth by month (last 6 months)
      const monthMap: Record<string, number> = {};
      schools.forEach((s) => {
        const month = format(new Date(s.created_at), "MMM yyyy");
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      setGrowthData(Object.entries(monthMap).slice(-6).map(([name, count]) => ({ name, count })));

      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome to EDUPRIMEX Super Admin Panel</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Schools" value={loading ? "..." : stats.totalSchools} icon={School} />
        <StatsCard title="Active Schools" value={loading ? "..." : stats.activeSchools} icon={CheckCircle} />
        <StatsCard title="Expired Schools" value={loading ? "..." : stats.expiredSchools} icon={AlertTriangle} />
        <StatsCard title="Total Students" value={loading ? "..." : stats.totalStudents} icon={GraduationCap} description="Across all schools" />
        <StatsCard title="Total Teachers" value={loading ? "..." : stats.totalTeachers} icon={Users} description="Across all schools" />
        <StatsCard title="Total Revenue" value={loading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* School Growth Chart */}
        {growthData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">School Registrations</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Schools */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Schools</CardTitle></CardHeader>
          <CardContent>
            {recentSchools.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No schools registered yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSchools.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/schools/${s.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {s.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{s.city || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                      <TableCell>{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
