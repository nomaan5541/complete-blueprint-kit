import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format } from "date-fns";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 70%, 50%)"];

export default function Reports() {
  const [schools, setSchools] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [sRes, subRes, pRes] = await Promise.all([
        supabase.from("schools").select("id, name, status, city, state, created_at"),
        supabase.from("subscriptions").select("*, subscription_plans(name)").order("created_at", { ascending: false }),
        supabase.from("payment_history").select("amount, status, payment_date, schools(name)").order("payment_date", { ascending: false }).limit(500),
      ]);
      setSchools(sRes.data || []);
      setSubscriptions(subRes.data || []);
      setPayments(pRes.data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  // School status distribution
  const statusCounts = schools.reduce((acc: Record<string, number>, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Revenue stats
  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0);

  // Monthly revenue (last 6 months)
  const monthlyRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((acc: Record<string, number>, p) => {
      const month = format(new Date(p.payment_date), "MMM yyyy");
      acc[month] = (acc[month] || 0) + Number(p.amount);
      return acc;
    }, {});
  const revenueChart = Object.entries(monthlyRevenue).slice(-6).map(([name, amount]) => ({ name, amount }));

  // Schools by state
  const stateData = schools.reduce((acc: Record<string, number>, s) => {
    const state = s.state || "Unknown";
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});
  const stateChart = Object.entries(stateData).map(([name, count]) => ({ name, count }));

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Platform-wide performance metrics</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{schools.length}</p><p className="text-sm text-muted-foreground">Total Schools</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{subscriptions.length}</p><p className="text-sm text-muted-foreground">Total Subscriptions</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">₹{pendingRevenue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Pending Payments</p></CardContent></Card>
          </div>
          {statusPie.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">School Status Distribution</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Collected</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{payments.length}</p><p className="text-sm text-muted-foreground">Total Transactions</p></CardContent></Card>
          </div>
          {revenueChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          {stateChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Schools by State</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Schools</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {schools.slice(0, 10).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.city || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                      <TableCell>{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
