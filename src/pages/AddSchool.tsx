import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AddSchool() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", pincode: "",
    phone: "", email: "", registration_number: "",
    adminName: "", adminEmail: "", adminPhone: "", adminPassword: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.adminEmail.trim() || !form.adminPassword.trim()) {
      toast.error("School name, admin email, and admin password are required");
      return;
    }
    if (form.adminPassword.length < 6) {
      toast.error("Admin password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      // Create admin user via edge function or direct signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.adminEmail,
        password: form.adminPassword,
        options: { data: { full_name: form.adminName } },
      });
      if (authError) throw authError;
      const adminUserId = authData.user?.id;
      if (!adminUserId) throw new Error("Failed to create admin user");

      // Create school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: form.name,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          phone: form.phone || null,
          email: form.email || null,
          registration_number: form.registration_number || null,
          admin_id: adminUserId,
        })
        .select()
        .single();
      if (schoolError) throw schoolError;

      // Assign school_admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: adminUserId, role: "school_admin" });
      if (roleError) throw roleError;

      // Update admin profile with school_id
      await supabase
        .from("profiles")
        .update({ school_id: school.id, full_name: form.adminName, phone: form.adminPhone || null })
        .eq("user_id", adminUserId);

      toast.success("School created successfully!");
      navigate("/schools");
    } catch (err: any) {
      toast.error(err.message || "Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/schools")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add School</h1>
          <p className="text-muted-foreground">Register a new school and its administrator</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2"><Label>School Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
            <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => update("state", e.target.value)} /></div>
            <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
            <div className="space-y-2"><Label>Registration Number</Label><Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>School Admin Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Admin Name</Label><Input value={form.adminName} onChange={(e) => update("adminName", e.target.value)} /></div>
            <div className="space-y-2"><Label>Admin Email *</Label><Input type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Admin Phone</Label><Input value={form.adminPhone} onChange={(e) => update("adminPhone", e.target.value)} /></div>
            <div className="space-y-2"><Label>Admin Password *</Label><Input type="password" value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} required minLength={6} /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/schools")}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create School
          </Button>
        </div>
      </form>
    </div>
  );
}
