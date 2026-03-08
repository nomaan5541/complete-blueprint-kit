import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, School, Upload, X, MessageSquare, CreditCard, Lock, CheckCircle2, AlertTriangle, Download, HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { exportSchoolBackup, type ExportFormat, type BackupProgress } from "@/lib/schoolBackup";
import { format } from "date-fns";

export default function SchoolSettings() {
  const { schoolId, isReadOnly, subscriptionExpired, subscriptionEndDate } = useSchool();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", pincode: "",
    phone: "", email: "", website: "", principal_name: "",
    school_start_time: "09:00", school_end_time: "16:00",
    registration_number: "", receipt_prefix: "RCPT",
  });
  const [smsForm, setSmsForm] = useState({ msg91_auth_key: "", msg91_sender_id: "", msg91_whatsapp_template_id: "" });
  const [savingSms, setSavingSms] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);

  // Renewal request state
  const [renewalMessage, setRenewalMessage] = useState("");
  const [sendingRenewal, setSendingRenewal] = useState(false);
  const [backupFormat, setBackupFormat] = useState<ExportFormat>("csv");
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [renewalSent, setRenewalSent] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, gRes, subRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId!).single(),
        supabase.from("grade_systems").select("*").eq("school_id", schoolId!).order("min_marks", { ascending: false }),
        supabase.from("subscriptions").select("*, subscription_plans(name, price, duration_months)").eq("school_id", schoolId!).order("end_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const s = sRes.data as any;
      if (s) {
        setForm({
          name: s.name || "",
          address: s.address || "",
          city: s.city || "",
          state: s.state || "",
          pincode: s.pincode || "",
          phone: s.phone || "",
          email: s.email || "",
          website: s.website || "",
          principal_name: s.principal_name || "",
          school_start_time: s.school_start_time || "09:00",
          school_end_time: s.school_end_time || "16:00",
          registration_number: s.registration_number || "",
          receipt_prefix: s.receipt_prefix || "RCPT",
        });
        setSmsForm({
          msg91_auth_key: s.msg91_auth_key || "",
          msg91_sender_id: s.msg91_sender_id || "",
          msg91_whatsapp_template_id: s.msg91_whatsapp_template_id || "",
        });
        setExistingLogo(s.logo_url || null);
        setLogoPreview(s.logo_url || null);
      }
      setGrades(gRes.data || []);
      setSubscription(subRes.data);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setExistingLogo(null);
  };

  const saveSchool = async () => {
    if (!schoolId) return;
    setSaving(true);

    let logoUrl = existingLogo;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("school-logos").upload(path, logoFile);
      if (uploadError) { toast.error(uploadError.message); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("school-logos").getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("schools").update({
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      principal_name: form.principal_name || null,
      school_start_time: form.school_start_time || null,
      school_end_time: form.school_end_time || null,
      registration_number: form.registration_number || null,
      receipt_prefix: form.receipt_prefix || "RCPT",
      logo_url: logoUrl,
    } as any).eq("id", schoolId);
    if (error) toast.error(error.message);
    else {
      toast.success("School settings updated");
      setExistingLogo(logoUrl);
      setLogoFile(null);
    }
    setSaving(false);
  };

  const saveSmsSettings = async () => {
    if (!schoolId) return;
    setSavingSms(true);
    const { error } = await supabase.from("schools").update({
      msg91_auth_key: smsForm.msg91_auth_key || null,
      msg91_sender_id: smsForm.msg91_sender_id || null,
      msg91_whatsapp_template_id: smsForm.msg91_whatsapp_template_id || null,
    } as any).eq("id", schoolId);
    if (error) toast.error(error.message);
    else toast.success("SMS settings saved");
    setSavingSms(false);
  };

  const handleRenewalRequest = async () => {
    if (!schoolId || !user) return;
    setSendingRenewal(true);

    const { error } = await supabase.from("subscription_requests").insert({
      school_name: form.name,
      contact_name: form.principal_name || form.name,
      email: user.email || form.email || "",
      phone: form.phone || null,
      message: renewalMessage || "Subscription renewal request",
      plan_id: subscription?.plan_id || null,
    });

    if (error) {
      toast.error("Failed to send renewal request: " + error.message);
    } else {
      toast.success("Renewal request submitted! The platform administrator will contact you shortly.");
      setRenewalSent(true);
    }
    setSendingRenewal(false);
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Settings</h1>
        <p className="text-muted-foreground">Manage school information and preferences</p>
      </div>

      <Tabs defaultValue={subscriptionExpired ? "subscription" : "info"}>
        <TabsList>
          <TabsTrigger value="info"><School className="mr-2 h-4 w-4" />School Info</TabsTrigger>
          <TabsTrigger value="grades">Grade System</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare className="mr-2 h-4 w-4" />SMS / WhatsApp</TabsTrigger>
          <TabsTrigger value="backup"><HardDrive className="mr-2 h-4 w-4" />Data Backup</TabsTrigger>
          <TabsTrigger value="subscription" className={subscriptionExpired ? "text-destructive" : ""}>
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
            {subscriptionExpired && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Update your school's details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>School Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-xl object-cover border" />
                      <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">Max 2MB. Used in receipts and report cards.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2"><Label>School Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Principal Name</Label><Input value={form.principal_name} onChange={(e) => setForm((p) => ({ ...p, principal_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Registration Number</Label><Input value={form.registration_number} onChange={(e) => setForm((p) => ({ ...p, registration_number: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} /></div>
                <div className="sm:col-span-2 space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} /></div>
                <div className="space-y-2"><Label>School Start Time</Label><Input type="time" value={form.school_start_time} onChange={(e) => setForm((p) => ({ ...p, school_start_time: e.target.value }))} /></div>
                <div className="space-y-2"><Label>School End Time</Label><Input type="time" value={form.school_end_time} onChange={(e) => setForm((p) => ({ ...p, school_end_time: e.target.value }))} /></div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Receipt Number Prefix</Label>
                  <div className="flex items-center gap-3">
                    <Input value={form.receipt_prefix} onChange={(e) => setForm((p) => ({ ...p, receipt_prefix: e.target.value.toUpperCase() }))} className="w-40" maxLength={10} placeholder="RCPT" />
                    <span className="text-sm text-muted-foreground">Preview: <Badge variant="outline" className="font-mono">{form.receipt_prefix || "RCPT"}-0001</Badge></span>
                  </div>
                  <p className="text-xs text-muted-foreground">Used in fee receipts. Counter auto-increments with each payment.</p>
                </div>
              </div>
              <Button onClick={saveSchool} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Grade System</CardTitle>
              <CardDescription>Your school's grading scale for report cards</CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No grade system configured. Run the setup wizard to configure.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Min Marks</TableHead>
                      <TableHead>Max Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell><Badge variant="outline" className="text-sm">{g.grade}</Badge></TableCell>
                        <TableCell>{g.min_marks}</TableCell>
                        <TableCell>{g.max_marks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS & WhatsApp Settings</CardTitle>
              <CardDescription>Configure MSG91 credentials to send notifications via SMS and WhatsApp to parents and teachers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                <p className="font-medium mb-1">How to get MSG91 credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Sign up at <span className="font-mono text-primary">msg91.com</span></li>
                  <li>Go to Dashboard → Settings → Authkey to get your Auth Key</li>
                  <li>Register a Sender ID (6 characters) under SMS → Sender ID</li>
                  <li>For WhatsApp, create a template under WhatsApp → Templates</li>
                </ol>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>MSG91 Auth Key</Label>
                  <Input
                    type="password"
                    value={smsForm.msg91_auth_key}
                    onChange={(e) => setSmsForm((p) => ({ ...p, msg91_auth_key: e.target.value }))}
                    placeholder="Enter your MSG91 authentication key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input
                    value={smsForm.msg91_sender_id}
                    onChange={(e) => setSmsForm((p) => ({ ...p, msg91_sender_id: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SCHOOL"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">6-character sender ID registered with MSG91</p>
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Template ID (optional)</Label>
                  <Input
                    value={smsForm.msg91_whatsapp_template_id}
                    onChange={(e) => setSmsForm((p) => ({ ...p, msg91_whatsapp_template_id: e.target.value }))}
                    placeholder="Template ID from MSG91"
                  />
                </div>
              </div>
              <Button onClick={saveSmsSettings} disabled={savingSms}>
                {savingSms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save SMS Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="space-y-4">
            {/* Current Subscription Status */}
            <Card className={subscriptionExpired ? "border-destructive/50" : "border-success/50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {subscriptionExpired ? (
                    <><AlertTriangle className="h-5 w-5 text-destructive" /> Subscription Expired</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5 text-success" /> Active Subscription</>
                  )}
                </CardTitle>
                <CardDescription>
                  {subscriptionExpired
                    ? "Your subscription has expired. All sections are locked except Dashboard and Settings."
                    : "Your subscription is active and all features are available."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Plan</p>
                    <p className="font-semibold">{subscription?.subscription_plans?.name || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                    <p className={`font-semibold ${subscriptionExpired ? "text-destructive" : ""}`}>
                      {subscriptionEndDate ? format(new Date(subscriptionEndDate), "dd MMM yyyy") : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    {subscriptionExpired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground">Active</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Renewal Request Form */}
            {subscriptionExpired && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Request Subscription Renewal
                  </CardTitle>
                  <CardDescription>
                    Submit a renewal request to the platform administrator. They will process your request and activate your subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renewalSent ? (
                    <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
                      <p className="font-semibold text-lg">Renewal Request Submitted!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The platform administrator will review your request and contact you shortly. Once approved, all sections will be unlocked automatically.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">School:</span>
                            <span className="font-medium">{form.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact:</span>
                            <span className="font-medium">{user?.email || form.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Plan:</span>
                            <span className="font-medium">{subscription?.subscription_plans?.name || "—"}</span>
                          </div>
                          {subscription?.subscription_plans?.price && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-medium">₹{Number(subscription.subscription_plans.price).toLocaleString()} / {subscription.subscription_plans.duration_months} months</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Message (optional)</Label>
                        <Textarea
                          value={renewalMessage}
                          onChange={(e) => setRenewalMessage(e.target.value)}
                          placeholder="Any additional notes for the administrator (e.g., preferred plan, payment method, etc.)"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleRenewalRequest} disabled={sendingRenewal} size="lg" className="w-full">
                        {sendingRenewal ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        Submit Renewal Request
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
