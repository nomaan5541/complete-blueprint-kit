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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Shield, CreditCard, Upload, X, QrCode, Wallet } from "lucide-react";

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

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    async function fetch() {
      if (!user) return;
      const [profRes, plansRes, payRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscription_plans").select("*").order("price"),
        supabase.from("platform_payment_settings").select("*").limit(1).maybeSingle(),
      ]);
      setProfile(profRes.data);
      setProfileForm({ full_name: profRes.data?.full_name || "", phone: profRes.data?.phone || "" });
      setPlans(plansRes.data || []);
      const pay = payRes.data as any;
      if (pay) {
        setPaymentSettings(pay);
        setUpiId(pay.upi_id || "");
        setPaymentInstructions(pay.payment_instructions || "");
        setQrPreview(pay.qr_code_url || null);
      }
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

  const handleQrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("QR image must be under 2MB"); return; }
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const removeQr = () => {
    setQrFile(null);
    setQrPreview(null);
  };

  const savePaymentSettings = async () => {
    if (!user) return;
    setSavingPayment(true);

    let qrUrl = paymentSettings?.qr_code_url || null;

    // Upload QR if new file
    if (qrFile) {
      const ext = qrFile.name.split(".").pop();
      const path = `qr-codes/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("platform-assets").upload(path, qrFile);
      if (upErr) { toast.error("QR upload failed: " + upErr.message); setSavingPayment(false); return; }
      const { data: urlData } = supabase.storage.from("platform-assets").getPublicUrl(path);
      qrUrl = urlData.publicUrl;
    }

    const payData = {
      qr_code_url: qrUrl,
      upi_id: upiId || null,
      payment_instructions: paymentInstructions || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (paymentSettings?.id) {
      ({ error } = await supabase.from("platform_payment_settings").update(payData as any).eq("id", paymentSettings.id));
    } else {
      const res = await supabase.from("platform_payment_settings").insert(payData as any).select().single();
      error = res.error;
      if (res.data) setPaymentSettings(res.data);
    }

    if (error) toast.error(error.message);
    else {
      toast.success("Payment settings saved");
      setQrFile(null);
      if (qrUrl) setQrPreview(qrUrl);
    }
    setSavingPayment(false);
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
          <TabsTrigger value="payment"><Wallet className="mr-2 h-4 w-4" />Payment Settings</TabsTrigger>
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

        <TabsContent value="payment">
          <div className="space-y-4">
            {/* QR Code & UPI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> QR Code & UPI Settings
                </CardTitle>
                <CardDescription>Upload a payment QR code and UPI ID for schools to pay for subscriptions manually</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment QR Code</Label>
                  <div className="flex items-start gap-4">
                    {qrPreview ? (
                      <div className="relative">
                        <img src={qrPreview} alt="Payment QR" className="h-40 w-40 rounded-xl object-contain border bg-white p-2" />
                        <button type="button" onClick={removeQr} className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-40 w-40 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2">Upload QR Code</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleQrSelect} />
                      </label>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Upload your payment QR code (UPI, Google Pay, PhonePe, etc.)</p>
                      <p>Max file size: 2MB</p>
                      <p>This QR code will be shown to school admins on the subscription page</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@upi or yourname@paytm"
                  />
                  <p className="text-xs text-muted-foreground">School admins can use this UPI ID to make direct payments</p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Instructions</Label>
                  <Textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="e.g. Scan the QR code or pay via UPI. After payment, share screenshot with us for verification."
                    rows={3}
                  />
                </div>

                <Button onClick={savePaymentSettings} disabled={savingPayment}>
                  {savingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>

            {/* Stripe Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Stripe Payments
                </CardTitle>
                <CardDescription>Stripe is configured for online subscription payments. School admins can pay for plans via Stripe checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-success/30 bg-success/10 p-4 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <div>
                    <p className="font-medium text-sm">Stripe Integration Active</p>
                    <p className="text-xs text-muted-foreground">School admins can pay for subscriptions via Stripe checkout on the subscription page</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
