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
import { Loader2, Save, School } from "lucide-react";

export default function SchoolSettings() {
  const { schoolId } = useSchool();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", pincode: "",
    phone: "", email: "", website: "", principal_name: "",
    school_start_time: "09:00", school_end_time: "16:00",
    registration_number: "",
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
        });
      }
      setGrades(gRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const saveSchool = async () => {
    if (!schoolId) return;
    setSaving(true);
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
    }).eq("id", schoolId);
    if (error) toast.error(error.message);
    else toast.success("School settings updated");
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
