import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [counts, setCounts] = useState({ students: 0, teachers: 0 });
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [schoolRes, subRes, studRes, teachRes, yearRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", id).single(),
        supabase.from("subscriptions").select("*, subscription_plans(*)").eq("school_id", id).eq("is_active", true).maybeSingle(),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", id).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", id).eq("status", "active"),
        supabase.from("academic_years").select("name").eq("school_id", id).eq("status", "active").maybeSingle(),
      ]);

      const s = schoolRes.data;
      setSchool(s);
      setSubscription(subRes.data);
      setCounts({ students: studRes.count ?? 0, teachers: teachRes.count ?? 0 });
      setActiveYear(yearRes.data?.name || null);

      if (s?.admin_id) {
        const { data: p } = await supabase.from("profiles").select("*").eq("user_id", s.admin_id).single();
        setAdminProfile(p);
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
          <div>
            <h1 className="text-3xl font-bold">{school.name}</h1>
            <Badge variant="outline" className={statusColors[school.status] || ""}>{school.status}</Badge>
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
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{counts.students}</p><p className="text-sm text-muted-foreground">Students</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{counts.teachers}</p><p className="text-sm text-muted-foreground">Teachers</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{activeYear || "—"}</p><p className="text-sm text-muted-foreground">Academic Year</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{subscription?.subscription_plans?.name || "None"}</p><p className="text-sm text-muted-foreground">Plan</p></CardContent></Card>
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
            <Row label="Created" value={new Date(school.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Admin Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {adminProfile ? (
              <>
                <Row label="Name" value={adminProfile.full_name} />
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
              <div className="grid gap-3 sm:grid-cols-4">
                <Row label="Plan" value={subscription.subscription_plans?.name} />
                <Row label="Start Date" value={subscription.start_date} />
                <Row label="End Date" value={subscription.end_date} />
                <Row label="Amount" value={`₹${Number(subscription.payment_amount).toLocaleString()}`} />
              </div>
            ) : (
              <p className="text-muted-foreground">No active subscription</p>
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
