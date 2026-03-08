import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Pencil, Save } from "lucide-react";

export default function TeacherProfile() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const [tRes, pRes] = await Promise.all([
        supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      setTeacher(tRes.data);
      setProfile(pRes.data);
      setPhone(tRes.data?.phone || pRes.data?.phone || "");

      if (tRes.data) {
        const [sRes, aRes] = await Promise.all([
          supabase.from("schools").select("name, city, state").eq("id", tRes.data.school_id).maybeSingle(),
          supabase.from("teacher_assignments").select("*, classes(name), subjects(name), academic_years(name)").eq("teacher_id", tRes.data.id),
        ]);
        setSchool(sRes.data);
        setAssignments(aRes.data || []);
      }
      setLoading(false);
    }
    fetch();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ phone }).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); setEditing(false); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher profile found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{teacher.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{teacher.name}</h2>
              <p className="text-sm text-muted-foreground">{teacher.employee_id || "Teacher"}</p>
            </div>
            <Badge variant="outline">{teacher.status || "active"}</Badge>
            {school && <p className="text-xs text-muted-foreground">{school.name}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Name" value={teacher.name} />
            <Field label="Email" value={teacher.email || user?.email} />
            <Field label="Employee ID" value={teacher.employee_id} />
            <Field label="Qualification" value={teacher.qualification} />
            <Field label="Gender" value={teacher.gender} />
            <Field label="Date of Birth" value={teacher.date_of_birth} />
            {editing ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
            ) : (
              <Field label="Phone" value={teacher.phone || phone} />
            )}
            <Field label="Subject Specialization" value={teacher.specialization} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Assigned Classes & Subjects</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assignments yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignments.map(a => (
                  <Badge key={a.id} variant="secondary" className="text-sm py-1 px-3">
                    {a.classes?.name} — {a.subjects?.name} ({a.academic_years?.name})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
