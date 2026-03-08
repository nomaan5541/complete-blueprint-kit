import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, GraduationCap, Users, Calendar, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addMonths } from "date-fns";

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ plan_id: "", payment_amount: "", duration_months: "12" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [schoolRes, subRes, studRes, teachRes, yearRes, planRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", id).single(),
        supabase.from("subscriptions").select("*, subscription_plans(*)").eq("school_id", id).eq("is_active", true).maybeSingle(),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", id).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", id).eq("status", "active"),
        supabase.from("academic_years").select("name").eq("school_id", id).eq("status", "active").maybeSingle(),
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("price"),
      ]);

      const s = schoolRes.data;
      setSchool(s);
      setSubscription(subRes.data);
      setCounts({ students: studRes.count ?? 0, teachers: teachRes.count ?? 0 });
      setActiveYear(yearRes.data?.name || null);
      setPlans(planRes.data || []);

      if (s?.admin_id) {
        const { data: p } = await supabase.from("profiles").select("*").eq("user_id", s.admin_id).single();
        setAdminProfile(p);
        // Get admin email from auth metadata stored in profile or use school email
        setAdminEmail(s.email || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from("schools").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`School ${status}`); setSchool((p: any) => ({ ...p, status })); }
  };

  const handleAssignSubscription = async () => {
    if (!assignForm.plan_id || !id) return;
    setSaving(true);
    try {
      const plan = plans.find((p: any) => p.id === assignForm.plan_id);
      const months = parseInt(assignForm.duration_months) || 12;
      const startDate = new Date();
      const endDate = addMonths(startDate, months);

      // Deactivate existing subscriptions
      await supabase.from("subscriptions").update({ is_active: false }).eq("school_id", id).eq("is_active", true);

      const { error } = await supabase.from("subscriptions").insert({
        school_id: id,
        plan_id: assignForm.plan_id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        payment_amount: parseFloat(assignForm.payment_amount) || plan?.price || 0,
        payment_status: "paid",
        is_active: true,
      });
      if (error) throw error;

      // Set school status to active
      await supabase.from("schools").update({ status: "active" as any }).eq("id", id);
      setSchool((p: any) => ({ ...p, status: "active" }));

      toast.success("Subscription assigned successfully!");
      setAssignOpen(false);
      // Refresh subscription data
      const { data: subData } = await supabase.from("subscriptions").select("*, subscription_plans(*)").eq("school_id", id).eq("is_active", true).maybeSingle();
      setSubscription(subData);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!school) return <div className="p-10 text-center text-muted-foreground">School not found</div>;

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    inactive: "bg-muted text-muted-foreground",
    expired: "bg-destructive/10 text-destructive",
    suspended: "bg-warning/10 text-warning",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/schools")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-4">
            {school.logo_url ? (
              <img src={school.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{school.name}</h1>
              <Badge variant="outline" className={statusColors[school.status] || ""}>{school.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={school.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate(`/schools/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <GraduationCap className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{counts.students}</p>
          <p className="text-sm text-muted-foreground">Students</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{counts.teachers}</p>
          <p className="text-sm text-muted-foreground">Teachers</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{activeYear || "—"}</p>
          <p className="text-sm text-muted-foreground">Academic Year</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <CreditCard className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{subscription?.subscription_plans?.name || "None"}</p>
          <p className="text-sm text-muted-foreground">Plan</p>
        </CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>School Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email" value={school.email} />
            <Row label="Phone" value={school.phone} />
            <Row label="Address" value={[school.address, school.city, school.state, school.pincode].filter(Boolean).join(", ")} />
            <Row label="Registration No." value={school.registration_number} />
            <Row label="Principal" value={school.principal_name} />
            <Row label="Website" value={school.website} />
            <Row label="School Timings" value={school.school_start_time && school.school_end_time ? `${school.school_start_time} — ${school.school_end_time}` : null} />
            <Row label="Created" value={format(new Date(school.created_at), "dd MMM yyyy")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Admin Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {adminProfile ? (
              <>
                <Row label="Name" value={adminProfile.full_name} />
                <Row label="Email" value={adminEmail} />
                <Row label="Phone" value={adminProfile.phone} />
              </>
            ) : (
              <p className="text-muted-foreground">No admin assigned</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {subscription ? (
              <div className="grid gap-3 sm:grid-cols-5">
                <Row label="Plan" value={subscription.subscription_plans?.name} />
                <Row label="Start Date" value={subscription.start_date} />
                <Row label="End Date" value={subscription.end_date} />
                <Row label="Amount" value={`₹${Number(subscription.payment_amount).toLocaleString()}`} />
                <Row label="Payment" value={subscription.payment_status} />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">No active subscription</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/subscriptions")}>Assign Plan</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
