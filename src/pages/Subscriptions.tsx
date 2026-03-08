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
import { toast } from "sonner";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
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

  const fetchAll = async () => {
    setLoading(true);
    const [subRes, planRes, schoolRes] = await Promise.all([
      supabase.from("subscriptions").select("*, schools(name), subscription_plans(name, price)").order("created_at", { ascending: false }),
      supabase.from("subscription_plans").select("*").eq("is_active", true),
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
      // Also record payment
      await supabase.from("payment_history").insert({
        school_id: assignForm.school_id,
        amount,
        status: "paid",
        notes: `Subscription: ${plan?.name}`,
      });
      toast.success("Subscription assigned");
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
      end_date: newEndStr,
      payment_status: "paid",
    }).eq("id", renewId);

    if (!error) {
      // Record payment history
      await supabase.from("payment_history").insert({
        school_id: sub.school_id,
        subscription_id: renewId,
        amount: sub.payment_amount,
        status: "paid",
        notes: `Renewal: +${renewMonths} months. Old expiry: ${sub.end_date}. New expiry: ${newEndStr}`,
      });

      // If school was expired/inactive, reactivate it
      const isNowValid = new Date(newEndStr) > new Date();
      if (isNowValid) {
        await supabase.from("schools").update({ status: "active" as any }).eq("id", sub.school_id);
      }

      toast.success(`Subscription renewed until ${format(newEnd, "dd MMM yyyy")}`);
      setRenewId(null);
      fetchAll();
    } else toast.error(error.message);
    setSaving(false);
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
        <Button onClick={() => setAssignOpen(true)}><Plus className="mr-2 h-4 w-4" /> Assign Plan</Button>
      </div>

      {/* Plans overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="pb-2"><CardTitle className="text-lg">{plan.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{Number(plan.price).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">/{plan.duration_months} months</p>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
}
