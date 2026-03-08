import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, School, Upload, X } from "lucide-react";

export default function SchoolSettings() {
  const { schoolId } = useSchool();
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
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [sRes, gRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId!).single(),
        supabase.from("grade_systems").select("*").eq("school_id", schoolId!).order("min_marks", { ascending: false }),
      ]);
      const s = sRes.data;
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
          receipt_prefix: (s as any).receipt_prefix || "RCPT",
        });
        setExistingLogo(s.logo_url || null);
        setLogoPreview(s.logo_url || null);
      }
      setGrades(gRes.data || []);
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

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Settings</h1>
        <p className="text-muted-foreground">Manage school information and preferences</p>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info"><School className="mr-2 h-4 w-4" />School Info</TabsTrigger>
          <TabsTrigger value="grades">Grade System</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
