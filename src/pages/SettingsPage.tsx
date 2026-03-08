import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Settings, Shield, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });

  // Plan management
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", description: "", price: "", duration_months: "12", max_students: "", max_teachers: "" });

  useEffect(() => {
    async function fetch() {
      if (!user) return;
      const [profRes, plansRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscription_plans").select("*").order("price"),
      ]);
      setProfile(profRes.data);
      setProfileForm({ full_name: profRes.data?.full_name || "", phone: profRes.data?.phone || "" });
      setPlans(plansRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      phone: profileForm.phone || null,
    }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSaving(false);
  };

  const createPlan = async () => {
    if (!planForm.name.trim()) { toast.error("Plan name required"); return; }
    setSaving(true);
    const { error } = await supabase.from("subscription_plans").insert({
      name: planForm.name.trim(),
      description: planForm.description || null,
      price: parseFloat(planForm.price) || 0,
      duration_months: parseInt(planForm.duration_months) || 12,
      max_students: planForm.max_students ? parseInt(planForm.max_students) : null,
      max_teachers: planForm.max_teachers ? parseInt(planForm.max_teachers) : null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Plan created");
      setPlanOpen(false);
      setPlanForm({ name: "", description: "", price: "", duration_months: "12", max_students: "", max_teachers: "" });
      const { data } = await supabase.from("subscription_plans").select("*").order("price");
      setPlans(data || []);
    }
    setSaving(false);
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Plan deleted"); setPlans((p) => p.filter((pl) => pl.id !== id)); }
  };

  const togglePlan = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("subscription_plans").update({ is_active: !isActive }).eq("id", id);
    if (error) toast.error(error.message);
    else { setPlans((p) => p.map((pl) => pl.id === id ? { ...pl, is_active: !isActive } : pl)); }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><Shield className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="plans"><CreditCard className="mr-2 h-4 w-4" />Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPlanOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Plan</Button>
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Max Students</TableHead>
                  <TableHead>Max Teachers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No plans created yet</TableCell></TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>₹{Number(plan.price).toLocaleString()}</TableCell>
                      <TableCell>{plan.duration_months} months</TableCell>
                      <TableCell>{plan.max_students || "Unlimited"}</TableCell>
                      <TableCell>{plan.max_teachers || "Unlimited"}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => togglePlan(plan.id, plan.is_active)}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={planOpen} onOpenChange={setPlanOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Subscription Plan</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Plan Name</Label><Input value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Starter" /></div>
                <div className="space-y-1"><Label>Description</Label><Input value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Price (₹)</Label><Input type="number" value={planForm.price} onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Duration (months)</Label><Input type="number" value={planForm.duration_months} onChange={(e) => setPlanForm((p) => ({ ...p, duration_months: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Max Students</Label><Input type="number" value={planForm.max_students} onChange={(e) => setPlanForm((p) => ({ ...p, max_students: e.target.value }))} placeholder="Unlimited" /></div>
                  <div className="space-y-1"><Label>Max Teachers</Label><Input type="number" value={planForm.max_teachers} onChange={(e) => setPlanForm((p) => ({ ...p, max_teachers: e.target.value }))} placeholder="Unlimited" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
                <Button onClick={createPlan} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
