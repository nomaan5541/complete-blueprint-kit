import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, RefreshCw, Loader2, Pencil, Trash2, Crown } from "lucide-react";
import { format, addMonths, isBefore } from "date-fns";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [renewId, setRenewId] = useState<string | null>(null);
  const [renewMonths, setRenewMonths] = useState("12");
  const [saving, setSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({ school_id: "", plan_id: "", payment_amount: "" });

  // Plan editing state
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "", description: "", price: "", duration_months: "12",
    max_students: "", max_teachers: "", features: "", is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [subRes, planRes, schoolRes] = await Promise.all([
      supabase.from("subscriptions").select("*, schools(name), subscription_plans(name, price)").order("created_at", { ascending: false }),
      supabase.from("subscription_plans").select("*").order("price"),
      supabase.from("schools").select("id, name"),
    ]);
    setSubscriptions(subRes.data || []);
    setPlans(planRes.data || []);
    setSchools(schoolRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAssign = async () => {
    if (!assignForm.school_id || !assignForm.plan_id) {
      toast.error("Select school and plan");
      return;
    }
    setSaving(true);
    const plan = plans.find((p) => p.id === assignForm.plan_id);
    const amount = assignForm.payment_amount ? parseFloat(assignForm.payment_amount) : plan?.price || 0;
    const startDate = new Date();
    const endDate = addMonths(startDate, plan?.duration_months || 12);

    const { error } = await supabase.from("subscriptions").insert({
      school_id: assignForm.school_id,
      plan_id: assignForm.plan_id,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      payment_amount: amount,
      payment_status: "paid",
    });
    if (error) toast.error(error.message);
    else {
      await supabase.from("payment_history").insert({
        school_id: assignForm.school_id, amount, status: "paid",
        notes: `Subscription: ${plan?.name}`,
      });
      await supabase.from("schools").update({ status: "active" as any }).eq("id", assignForm.school_id);
      toast.success("Subscription assigned & school activated");
      setAssignOpen(false);
      setAssignForm({ school_id: "", plan_id: "", payment_amount: "" });
      fetchAll();
    }
    setSaving(false);
  };

  const handleRenew = async () => {
    if (!renewId) return;
    setSaving(true);
    const sub = subscriptions.find((s) => s.id === renewId);
    const currentEnd = new Date(sub.end_date);
    const baseDate = isBefore(currentEnd, new Date()) ? new Date() : currentEnd;
    const newEnd = addMonths(baseDate, parseInt(renewMonths));
    const newEndStr = format(newEnd, "yyyy-MM-dd");

    const { error } = await supabase.from("subscriptions").update({
      end_date: newEndStr, payment_status: "paid",
    }).eq("id", renewId);

    if (!error) {
      await supabase.from("payment_history").insert({
        school_id: sub.school_id, subscription_id: renewId, amount: sub.payment_amount, status: "paid",
        notes: `Renewal: +${renewMonths} months. Old: ${sub.end_date}. New: ${newEndStr}`,
      });
      const isNowValid = new Date(newEndStr) > new Date();
      if (isNowValid) await supabase.from("schools").update({ status: "active" as any }).eq("id", sub.school_id);
      toast.success(`Renewed until ${format(newEnd, "dd MMM yyyy")}`);
      setRenewId(null);
      fetchAll();
    } else toast.error(error.message);
    setSaving(false);
  };

  const openEditPlan = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      const feats = Array.isArray(plan.features) ? plan.features.join("\n") : "";
      setPlanForm({
        name: plan.name, description: plan.description || "", price: plan.price?.toString() || "",
        duration_months: plan.duration_months?.toString() || "12",
        max_students: plan.max_students?.toString() || "", max_teachers: plan.max_teachers?.toString() || "",
        features: feats, is_active: plan.is_active,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: "", description: "", price: "", duration_months: "12", max_students: "", max_teachers: "", features: "", is_active: true });
    }
    setEditPlanOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    const featuresArr = planForm.features.split("\n").map(f => f.trim()).filter(Boolean);
    const payload = {
      name: planForm.name, description: planForm.description || null,
      price: parseFloat(planForm.price), duration_months: parseInt(planForm.duration_months),
      max_students: planForm.max_students ? parseInt(planForm.max_students) : null,
      max_teachers: planForm.max_teachers ? parseInt(planForm.max_teachers) : null,
      features: featuresArr, is_active: planForm.is_active,
    };
    if (editingPlan) {
      const { error } = await supabase.from("subscription_plans").update(payload).eq("id", editingPlan.id);
      if (error) toast.error(error.message); else toast.success("Plan updated");
    } else {
      const { error } = await supabase.from("subscription_plans").insert(payload);
      if (error) toast.error(error.message); else toast.success("Plan created");
    }
    setEditPlanOpen(false);
    fetchAll();
    setSaving(false);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    const { error } = await supabase.from("subscription_plans").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Plan deactivated"); fetchAll(); }
  };

  const isExpiring = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage school subscriptions and plans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openEditPlan()}><Plus className="mr-2 h-4 w-4" /> New Plan</Button>
          <Button onClick={() => setAssignOpen(true)}><Plus className="mr-2 h-4 w-4" /> Assign Plan</Button>
        </div>
      </div>

      {/* Plans overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isUltimate = plan.name?.toLowerCase() === "ultimate";
          return (
            <Card key={plan.id} className={isUltimate
              ? "relative overflow-hidden border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/20 dark:to-orange-950/10 shadow-lg"
              : ""}>
              {isUltimate && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-amber-500 text-white px-4 py-1 text-xs font-bold rounded-bl-xl flex items-center gap-1">
                  <Crown className="h-3 w-3" /> ULTIMATE
                </div>
              )}
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className={`text-lg ${isUltimate ? "text-amber-700 dark:text-amber-400" : ""}`}>{plan.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPlan(plan)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${isUltimate ? "text-amber-700 dark:text-amber-400" : ""}`}>₹{Number(plan.price).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">/{plan.duration_months} months</p>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subscriptions table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No subscriptions</TableCell></TableRow>
            ) : (
              subscriptions.map((sub) => {
                const isExpired = isBefore(new Date(sub.end_date), new Date());
                return (
                  <TableRow key={sub.id} className={isExpired ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{sub.schools?.name || "—"}</TableCell>
                    <TableCell>{sub.subscription_plans?.name || "—"}</TableCell>
                    <TableCell>{sub.start_date}</TableCell>
                    <TableCell>
                      {sub.end_date}
                      {isExpired && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                      {!isExpired && isExpiring(sub.end_date) && <Badge variant="outline" className="ml-2 bg-warning/10 text-warning text-xs">Expiring Soon</Badge>}
                    </TableCell>
                    <TableCell>₹{Number(sub.payment_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={isExpired ? "destructive" : sub.payment_status === "paid" ? "default" : "secondary"}>
                        {isExpired ? "expired" : sub.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant={isExpired ? "default" : "ghost"} size="sm" onClick={() => { setRenewId(sub.id); setRenewMonths("12"); }}>
                        <RefreshCw className="mr-1 h-3 w-3" /> {isExpired ? "Renew Now" : "Renew"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Subscription Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>School</Label>
              <Select value={assignForm.school_id} onValueChange={(v) => setAssignForm((p) => ({ ...p, school_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>{schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={assignForm.plan_id} onValueChange={(v) => {
                const plan = plans.find((p) => p.id === v);
                setAssignForm((p) => ({ ...p, plan_id: v, payment_amount: plan?.price?.toString() || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Amount (₹)</Label>
              <Input type="number" value={assignForm.payment_amount} onChange={(e) => setAssignForm((p) => ({ ...p, payment_amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={!!renewId} onOpenChange={() => setRenewId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renew Subscription</DialogTitle></DialogHeader>
          {renewId && (() => {
            const sub = subscriptions.find((s) => s.id === renewId);
            const isExpired = sub ? isBefore(new Date(sub.end_date), new Date()) : false;
            const baseDate = sub ? (isExpired ? new Date() : new Date(sub.end_date)) : new Date();
            const newEnd = addMonths(baseDate, parseInt(renewMonths));
            return (
              <div className="space-y-4">
                {sub && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                    <div><span className="text-muted-foreground">School: </span><span className="font-medium">{sub.schools?.name}</span></div>
                    <div><span className="text-muted-foreground">Plan: </span><span className="font-medium">{sub.subscription_plans?.name}</span></div>
                    <div><span className="text-muted-foreground">Current Expiry: </span><span className={`font-medium ${isExpired ? "text-destructive" : ""}`}>{sub.end_date} {isExpired && "(Expired)"}</span></div>
                    <div><span className="text-muted-foreground">New Expiry: </span><span className="font-medium text-primary">{format(newEnd, "dd MMM yyyy")}</span></div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Extend by</Label>
                  <Select value={renewMonths} onValueChange={setRenewMonths}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months (1 year)</SelectItem>
                      <SelectItem value="24">24 months (2 years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewId(null)}>Cancel</Button>
            <Button onClick={handleRenew} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Renew Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input value={planForm.name} onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Professional" />
              </div>
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input type="number" value={planForm.price} onChange={(e) => setPlanForm(p => ({ ...p, price: e.target.value }))} placeholder="10000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={planForm.description} onChange={(e) => setPlanForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration (months)</Label>
                <Input type="number" value={planForm.duration_months} onChange={(e) => setPlanForm(p => ({ ...p, duration_months: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max Students</Label>
                <Input type="number" value={planForm.max_students} onChange={(e) => setPlanForm(p => ({ ...p, max_students: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Max Teachers</Label>
                <Input type="number" value={planForm.max_teachers} onChange={(e) => setPlanForm(p => ({ ...p, max_teachers: e.target.value }))} placeholder="Unlimited" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea rows={5} value={planForm.features} onChange={(e) => setPlanForm(p => ({ ...p, features: e.target.value }))} placeholder="Attendance Tracking&#10;Fee Management&#10;..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
