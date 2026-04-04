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
import { Loader2, Save, School, Upload, X, MessageSquare, CreditCard, Lock, CheckCircle2, AlertTriangle, Download, HardDrive, KeyRound, Wallet, Eye, EyeOff, QrCode, ExternalLink } from "lucide-react";
import CredentialsTab from "@/components/settings/CredentialsTab";
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
  const [hasAuthKey, setHasAuthKey] = useState(false);
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
  
  // Payment config state
  const [paymentConfig, setPaymentConfig] = useState({ stripe_publishable_key: "", payment_enabled: false });
  const [savingPayment, setSavingPayment] = useState(false);
  const [platformPayment, setPlatformPayment] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, gRes, subRes, smsRes, payRes, platPayRes, plansRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId!).single(),
        supabase.from("grade_systems").select("*").eq("school_id", schoolId!).order("min_marks", { ascending: false }),
        supabase.from("subscriptions").select("*, subscription_plans(name, price, duration_months)").eq("school_id", schoolId!).order("end_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("school_sms_config_safe" as any).select("*").eq("school_id", schoolId!).maybeSingle(),
        supabase.from("school_payment_config").select("*").eq("school_id", schoolId!).maybeSingle(),
        supabase.from("platform_payment_settings").select("*").limit(1).maybeSingle(),
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("price"),
      ]);
      const s = sRes.data as any;
      const smsData = smsRes.data as any;
      const payData = payRes.data as any;
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
          msg91_auth_key: "",
          msg91_sender_id: smsData?.msg91_sender_id || "",
          msg91_whatsapp_template_id: smsData?.msg91_whatsapp_template_id || "",
        });
        setHasAuthKey(smsData?.has_auth_key || false);
        setPaymentConfig({
          stripe_publishable_key: payData?.stripe_publishable_key || "",
          payment_enabled: payData?.payment_enabled || false,
        });
        setExistingLogo(s.logo_url || null);
        setLogoPreview(s.logo_url || null);
      }
      setGrades(gRes.data || []);
      setSubscription(subRes.data);
      setPlatformPayment(platPayRes.data || null);
      setAvailablePlans(plansRes.data || []);
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
    const smsData = {
      school_id: schoolId!,
      msg91_auth_key: smsForm.msg91_auth_key || null,
      msg91_sender_id: smsForm.msg91_sender_id || null,
      msg91_whatsapp_template_id: smsForm.msg91_whatsapp_template_id || null,
    };
    const { error } = await supabase.from("school_sms_config").upsert(smsData as any, { onConflict: "school_id" });
    if (error) toast.error(error.message);
    else toast.success("SMS settings saved");
    setSavingSms(false);
  };

  const savePaymentConfig = async () => {
    if (!schoolId) return;
    setSavingPayment(true);
    const payData = {
      school_id: schoolId!,
      stripe_publishable_key: paymentConfig.stripe_publishable_key || null,
      payment_enabled: paymentConfig.payment_enabled,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("school_payment_config").upsert(payData as any, { onConflict: "school_id" });
    if (error) toast.error(error.message);
    else toast.success("Payment settings saved");
    setSavingPayment(false);
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="info"><School className="mr-2 h-4 w-4" />School Info</TabsTrigger>
          <TabsTrigger value="grades">Grade System</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare className="mr-2 h-4 w-4" />SMS / WhatsApp</TabsTrigger>
          <TabsTrigger value="payment"><Wallet className="mr-2 h-4 w-4" />Payment API</TabsTrigger>
          <TabsTrigger value="backup"><HardDrive className="mr-2 h-4 w-4" />Data Backup</TabsTrigger>
          <TabsTrigger value="credentials"><KeyRound className="mr-2 h-4 w-4" />Credentials</TabsTrigger>
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

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Payment API Configuration
              </CardTitle>
              <CardDescription>Configure Stripe API keys to enable online fee collection from students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                <p className="font-medium mb-1">How to get Stripe API keys:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Sign up at <span className="font-mono text-primary">stripe.com</span></li>
                  <li>Go to Developers → API Keys</li>
                  <li>Copy the Publishable key and Secret key</li>
                  <li>For production, ensure your Stripe account is activated</li>
                </ol>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Stripe Publishable Key</Label>
                  <Input
                    value={paymentConfig.stripe_publishable_key}
                    onChange={(e) => setPaymentConfig((p) => ({ ...p, stripe_publishable_key: e.target.value }))}
                    placeholder="pk_live_... or pk_test_..."
                  />
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🔒 Stripe Secret Key</p>
                  <p>For security, Stripe secret keys are no longer stored in the database. Configure your secret key as a server-side secret through your platform administrator.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="payment-enabled"
                    checked={paymentConfig.payment_enabled}
                    onChange={(e) => setPaymentConfig((p) => ({ ...p, payment_enabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="payment-enabled" className="cursor-pointer">Enable online payment collection</Label>
                </div>
              </div>
              <Button onClick={savePaymentConfig} disabled={savingPayment}>
                {savingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" /> Data Backup & Export
              </CardTitle>
              <CardDescription>
                Download a complete backup of your school's data. All records are filtered to include only your school's data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
                <p className="font-medium">What's included in the backup:</p>
                <div className="grid gap-1 sm:grid-cols-2 text-muted-foreground text-xs">
                  <span>✔ Students & Student Master</span>
                  <span>✔ Teachers & Assignments</span>
                  <span>✔ Classes, Sections & Subjects</span>
                  <span>✔ Attendance Records</span>
                  <span>✔ Exams & Marks</span>
                  <span>✔ Fee Types, Structures & Payments</span>
                  <span>✔ Timetable Slots & Entries</span>
                  <span>✔ Notifications & Events</span>
                  <span>✔ Grade Systems</span>
                  <span>✔ Audit Logs</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-3">
                  <Button variant={backupFormat === "csv" ? "default" : "outline"} size="sm" onClick={() => setBackupFormat("csv")}>
                    CSV (Spreadsheet)
                  </Button>
                  <Button variant={backupFormat === "json" ? "default" : "outline"} size="sm" onClick={() => setBackupFormat("json")}>
                    JSON (Data)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {backupFormat === "csv"
                    ? "CSV files can be opened in Excel, Google Sheets, or any spreadsheet application."
                    : "JSON files preserve data types and structure, ideal for system restores."}
                </p>
              </div>

              {backupProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exporting: {backupProgress.currentTable}</span>
                    <span className="font-medium">{backupProgress.current}/{backupProgress.total}</span>
                  </div>
                  <Progress value={(backupProgress.current / backupProgress.total) * 100} className="h-2" />
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                disabled={backupRunning || !schoolId}
                onClick={async () => {
                  if (!schoolId) return;
                  setBackupRunning(true);
                  setBackupProgress(null);
                  try {
                    const filename = await exportSchoolBackup(schoolId, form.name, backupFormat, setBackupProgress);
                    toast.success(`Backup downloaded: ${filename}`);
                  } catch (err: any) {
                    toast.error("Backup failed: " + (err?.message || "Unknown error"));
                  } finally {
                    setBackupRunning(false);
                    setBackupProgress(null);
                  }
                }}
              >
                {backupRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {backupRunning ? "Generating Backup..." : "Download School Backup"}
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

            {/* Pay via Stripe */}
            {availablePlans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Pay Online via Stripe
                  </CardTitle>
                  <CardDescription>Choose a plan and pay securely using Stripe checkout</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {availablePlans.map((plan) => (
                      <div key={plan.id} className={`rounded-xl border p-4 space-y-3 ${subscription?.plan_id === plan.id ? "border-primary bg-primary/5" : ""}`}>
                        <div>
                          <p className="font-semibold text-lg">{plan.name}</p>
                          {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
                        </div>
                        <p className="text-2xl font-bold">₹{Number(plan.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{plan.duration_months}mo</span></p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Students: {plan.max_students || "Unlimited"}</p>
                          <p>Teachers: {plan.max_teachers || "Unlimited"}</p>
                        </div>
                        {subscription?.plan_id === plan.id && !subscriptionExpired ? (
                          <Badge className="w-full justify-center bg-success text-success-foreground">Current Plan</Badge>
                        ) : (
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={checkingOut === plan.id}
                            onClick={async () => {
                              if (!schoolId) return;
                              setCheckingOut(plan.id);
                              try {
                                const { data, error } = await supabase.functions.invoke("create-plan-checkout", {
                                  body: { planId: plan.id, schoolId },
                                });
                                if (error) throw error;
                                if (data?.url) {
                                  window.open(data.url, "_blank");
                                } else {
                                  throw new Error("No checkout URL returned");
                                }
                              } catch (err: any) {
                                toast.error("Checkout failed: " + (err?.message || "Unknown error"));
                              } finally {
                                setCheckingOut(null);
                              }
                            }}
                          >
                            {checkingOut === plan.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="mr-2 h-4 w-4" />
                            )}
                            Pay with Stripe
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QR / UPI Payment */}
            {(platformPayment?.qr_code_url || platformPayment?.upi_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" /> Pay via UPI / QR Code
                  </CardTitle>
                  <CardDescription>Scan the QR code or use the UPI ID to pay manually, then submit a renewal request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {platformPayment?.qr_code_url && (
                      <div className="shrink-0">
                        <img src={platformPayment.qr_code_url} alt="Payment QR" className="h-48 w-48 rounded-xl object-contain border bg-white p-2" />
                      </div>
                    )}
                    <div className="space-y-3">
                      {platformPayment?.upi_id && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-base px-3 py-1">{platformPayment.upi_id}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(platformPayment.upi_id);
                                toast.success("UPI ID copied!");
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                      {platformPayment?.payment_instructions && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Instructions</p>
                          <p className="text-sm">{platformPayment.payment_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Renewal Request Form */}
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
                      The platform administrator will review your request and contact you shortly.
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
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Message (optional)</Label>
                      <Textarea
                        value={renewalMessage}
                        onChange={(e) => setRenewalMessage(e.target.value)}
                        placeholder="Any additional notes (e.g., payment reference number, preferred plan)"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleRenewalRequest} disabled={sendingRenewal} size="lg" className="w-full">
                      {sendingRenewal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                      Submit Renewal Request
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          {schoolId && <CredentialsTab schoolId={schoolId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
