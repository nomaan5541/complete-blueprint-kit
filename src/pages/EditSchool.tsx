import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

export default function EditSchool() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", pincode: "",
    phone: "", email: "", registration_number: "",
    principal_name: "", website: "",
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data } = await supabase.from("schools").select("*").eq("id", id).single();
      if (data) {
        setForm({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          phone: data.phone || "",
          email: data.email || "",
          registration_number: data.registration_number || "",
          principal_name: data.principal_name || "",
          website: data.website || "",
        });
        setExistingLogo(data.logo_url || null);
        setLogoPreview(data.logo_url || null);
      }
      setFetching(false);
    }
    load();
  }, [id]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("School name is required"); return; }
    setLoading(true);

    let logoUrl = existingLogo;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("school-logos").upload(path, logoFile);
      if (uploadError) { toast.error(uploadError.message); setLoading(false); return; }
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
      registration_number: form.registration_number || null,
      principal_name: form.principal_name || null,
      website: form.website || null,
      logo_url: logoUrl,
    }).eq("id", id!);
    if (error) toast.error(error.message);
    else { toast.success("School updated"); navigate(`/schools/${id}`); }
    setLoading(false);
  };

  if (fetching) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/schools/${id}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-3xl font-bold">Edit School</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Logo Upload */}
            <div className="sm:col-span-2 space-y-2">
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
                <p className="text-xs text-muted-foreground">Max 2MB. Recommended: 200×200px</p>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2"><Label>School Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Principal Name</Label><Input value={form.principal_name} onChange={(e) => update("principal_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
            <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => update("state", e.target.value)} /></div>
            <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
            <div className="space-y-2"><Label>Registration Number</Label><Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate(`/schools/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
