import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Sparkles, RefreshCw, Loader2, School, GraduationCap, Users,
  FileText, ClipboardCheck, IndianRupee, AlertTriangle, CheckCircle,
  TrendingUp, Trophy, Lightbulb, ShieldAlert, BarChart3, BookOpen,
  Video, HardDrive,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
];

interface PlatformSummary {
  total_schools: number;
  active_schools: number;
  total_students: number;
  active_students: number;
  total_teachers: number;
  total_documents: number;
  total_exams: number;
  total_fee_collected: number;
  total_attendance_records: number;
  total_homework: number;
  total_meetings: number;
  schools_with_subscriptions: number;
}

interface SchoolAnalytic {
  school_id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  status: string;
  total_students: number;
  active_students: number;
  total_teachers: number;
  total_documents: number;
  document_types: string[];
  total_exams: number;
  online_exams: number;
  total_fee_collected: number;
  attendance_records: number;
  attendance_rate: number;
  total_homework: number;
  total_meetings: number;
  subscription: { plan_name: string; is_active: boolean; end_date: string } | null;
}

interface AIInsights {
  overall_health_score: number;
  health_label: string;
  key_insights: string[];
  recommendations: string[];
  alerts: string[];
  school_rankings: { name: string; score: number; reason: string }[];
  growth_opportunities: string[];
}

export default function AIAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [schools, setSchools] = useState<SchoolAnalytic[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-school-analytics");
      if (error) throw error;
      setSummary(data.platform_summary);
      setSchools(data.school_analytics || []);
      setInsights(data.ai_insights);
    } catch (err: any) {
      toast.error(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Analyzing all schools with AI...</p>
        <p className="text-xs text-muted-foreground">This may take a few seconds</p>
      </div>
    );
  }

  const healthColor = insights
    ? insights.overall_health_score >= 80 ? "text-emerald-500"
    : insights.overall_health_score >= 60 ? "text-amber-500"
    : "text-destructive"
    : "";

  // Chart data
  const topSchoolsByStudents = [...schools]
    .sort((a, b) => b.total_students - a.total_students)
    .slice(0, 8)
    .map(s => ({ name: s.school_name.length > 15 ? s.school_name.slice(0, 15) + "…" : s.school_name, students: s.total_students, teachers: s.total_teachers }));

  const feePieData = [...schools]
    .filter(s => s.total_fee_collected > 0)
    .sort((a, b) => b.total_fee_collected - a.total_fee_collected)
    .slice(0, 6)
    .map(s => ({ name: s.school_name.length > 12 ? s.school_name.slice(0, 12) + "…" : s.school_name, value: s.total_fee_collected }));

  const subscriptionDistribution = (() => {
    const map: Record<string, number> = {};
    schools.forEach(s => {
      const plan = s.subscription?.plan_name || "No Plan";
      map[plan] = (map[plan] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AI School Analytics</h1>
            <p className="text-muted-foreground text-sm">AI-powered insights across all schools</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* AI Health Score */}
      {insights && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-extrabold ${healthColor}`}>{insights.overall_health_score}</div>
                <p className="text-sm text-muted-foreground mt-1">Health Score</p>
                <Badge className={`mt-2 ${
                  insights.overall_health_score >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                  insights.overall_health_score >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {insights.health_label}
                </Badge>
              </div>
              <div className="flex-1 space-y-2">
                <Progress value={insights.overall_health_score} className="h-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.key_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Stats Grid */}
      {summary && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Schools", value: summary.total_schools, sub: `${summary.active_schools} active`, icon: School, color: "text-primary" },
            { label: "Students", value: summary.total_students, sub: `${summary.active_students} active`, icon: GraduationCap, color: "text-emerald-500" },
            { label: "Teachers", value: summary.total_teachers, sub: "Across all schools", icon: Users, color: "text-blue-500" },
            { label: "Documents", value: summary.total_documents, sub: "Files uploaded", icon: FileText, color: "text-amber-500" },
            { label: "Exams", value: summary.total_exams, sub: "Total created", icon: ClipboardCheck, color: "text-purple-500" },
            { label: "Fee Collected", value: `₹${summary.total_fee_collected.toLocaleString("en-IN")}`, sub: "Total revenue", icon: IndianRupee, color: "text-emerald-600" },
          ].map((stat, i) => (
            <Card key={i} className="glass border-0">
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Additional Stats Row */}
      {summary && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Attendance Records", value: summary.total_attendance_records.toLocaleString(), icon: ClipboardCheck },
            { label: "Homework Assigned", value: summary.total_homework, icon: BookOpen },
            { label: "Online Meetings", value: summary.total_meetings, icon: Video },
            { label: "Active Subscriptions", value: summary.schools_with_subscriptions, icon: HardDrive },
          ].map((stat, i) => (
            <Card key={i} className="glass border-0">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Schools by Students */}
        {topSchoolsByStudents.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Students & Teachers by School</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSchoolsByStudents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="teachers" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Teachers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Subscription Distribution */}
        {subscriptionDistribution.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Subscription Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={subscriptionDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {subscriptionDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fee Collection Pie */}
      {feePieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4 text-emerald-500" /> Fee Collection by School</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={feePieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}>
                  {feePieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Section */}
      {insights && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts */}
          {insights.alerts.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4" /> Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <span className="text-foreground">{alert}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Growth Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.growth_opportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="text-muted-foreground">{opp}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* School Rankings */}
      {insights?.school_rankings && insights.school_rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> AI School Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.school_rankings
                  .sort((a, b) => b.score - a.score)
                  .map((rank, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{rank.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={rank.score} className="h-2 w-20" />
                        <span className="text-sm font-medium">{rank.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rank.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed School Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4 text-primary" /> Detailed School Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Teachers</TableHead>
                <TableHead className="text-center">Documents</TableHead>
                <TableHead className="text-center">Exams</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
                <TableHead className="text-right">Fee Collected</TableHead>
                <TableHead>Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No school data available</TableCell></TableRow>
              ) : (
                schools
                  .sort((a, b) => b.total_students - a.total_students)
                  .map((school) => (
                  <TableRow key={school.school_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{school.school_name}</div>
                        <div className="text-xs text-muted-foreground">{[school.city, school.state].filter(Boolean).join(", ") || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{school.active_students}</div>
                      {school.total_students !== school.active_students && (
                        <div className="text-xs text-muted-foreground">/{school.total_students} total</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{school.total_teachers}</TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{school.total_documents}</div>
                      {school.document_types.length > 0 && (
                        <div className="text-xs text-muted-foreground">{school.document_types.length} types</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{school.total_exams}</div>
                      {school.online_exams > 0 && (
                        <div className="text-xs text-muted-foreground">{school.online_exams} online</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={school.attendance_rate >= 80 ? "default" : school.attendance_rate >= 60 ? "secondary" : "destructive"} className="text-xs">
                        {school.attendance_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{school.total_fee_collected.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {school.subscription ? (
                        <Badge variant="outline" className="text-xs">{school.subscription.plan_name}</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">No Plan</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
