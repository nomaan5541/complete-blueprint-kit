import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, Search, Eye, Trash2, Pencil, UserPlus } from "lucide-react";

export default function Students() {
  const navigate = useNavigate();
  const { schoolId } = useSchool();
  const { academicYears, selectedYearId } = useAcademicYear();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const emptyForm = {
    admission_number: "", name: "", gender: "", date_of_birth: "", blood_group: "",
    father_name: "", mother_name: "", father_phone: "",
    address: "", city: "", state: "", pincode: "",
    admission_date: "", class_id: "", section_id: "", academic_year_id: "",
  };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    if (!schoolId || !selectedYearId) return;
    setLoading(true);
    let studQuery = supabase.from("students").select("*, classes(name), sections(name), academic_years(name), student_master(id, name, father_name, admission_number, gender, date_of_birth, blood_group, mother_name, father_phone, address, city, state, pincode, photo_url, user_id, status)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).order("name");
    const [studRes, clsRes, secRes] = await Promise.all([
      studQuery,
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
    ]);
    setStudents(studRes.data || []);
    setClasses(clsRes.data || []);
    setSections(secRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId, selectedYearId]);

  // Helper to get display values from master or fallback to student record
  const getMasterField = (s: any, field: string) => s.student_master?.[field] || s[field];

  const filteredStudents = students.filter((s) => {
    const name = getMasterField(s, "name");
    const admNo = getMasterField(s, "admission_number");
    if (search && !name?.toLowerCase().includes(search.toLowerCase()) && !admNo?.toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter !== "all" && s.class_id !== classFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.admission_number.trim() || !form.academic_year_id) {
      toast.error("Name, admission number, and academic year are required"); return;
    }
    setSaving(true);
    try {
      // First create or find master record
      const { data: existingMaster } = await supabase.from("student_master" as any)
        .select("id").eq("school_id", schoolId!).eq("admission_number", form.admission_number.trim()).maybeSingle();

      let masterId: string;
      if (existingMaster) {
        masterId = (existingMaster as any).id;
        // Update master with latest personal info
        await supabase.from("student_master" as any).update({
          name: form.name.trim(), gender: form.gender || null, date_of_birth: form.date_of_birth || null,
          blood_group: form.blood_group || null, father_name: form.father_name || null,
          mother_name: form.mother_name || null, father_phone: form.father_phone || null,
          address: form.address || null, city: form.city || null, state: form.state || null,
          pincode: form.pincode || null, admission_date: form.admission_date || null,
        } as any).eq("id", masterId);
      } else {
        const { data: newMaster, error: masterErr } = await supabase.from("student_master" as any).insert({
          school_id: schoolId!, admission_number: form.admission_number.trim(), name: form.name.trim(),
          gender: form.gender || null, date_of_birth: form.date_of_birth || null, blood_group: form.blood_group || null,
          father_name: form.father_name || null, mother_name: form.mother_name || null,
          father_phone: form.father_phone || null, address: form.address || null, city: form.city || null,
          state: form.state || null, pincode: form.pincode || null, admission_date: form.admission_date || null,
        } as any).select("id").single();
        if (masterErr) throw masterErr;
        masterId = (newMaster as any).id;
      }

      // Create year record
      const { error } = await supabase.from("students").insert({
        school_id: schoolId!, admission_number: form.admission_number.trim(), name: form.name.trim(),
        gender: form.gender || null, date_of_birth: form.date_of_birth || null, blood_group: form.blood_group || null,
        father_name: form.father_name || null, mother_name: form.mother_name || null, father_phone: form.father_phone || null,
        address: form.address || null, city: form.city || null, state: form.state || null, pincode: form.pincode || null,
        admission_date: form.admission_date || null, class_id: form.class_id || null, section_id: form.section_id || null,
        academic_year_id: form.academic_year_id, student_master_id: masterId,
      });
      if (error) throw error;
      toast.success("Student added"); setOpen(false); setForm(emptyForm); fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add student");
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedStudent || !form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      // Update master record personal info
      if (selectedStudent.student_master_id) {
        await supabase.from("student_master" as any).update({
          name: form.name.trim(), gender: form.gender || null, date_of_birth: form.date_of_birth || null,
          blood_group: form.blood_group || null, father_name: form.father_name || null,
          mother_name: form.mother_name || null, father_phone: form.father_phone || null,
          address: form.address || null, city: form.city || null, state: form.state || null, pincode: form.pincode || null,
        } as any).eq("id", selectedStudent.student_master_id);
      }
      // Update year record
      const { error } = await supabase.from("students").update({
        admission_number: form.admission_number.trim(), name: form.name.trim(),
        gender: form.gender || null, date_of_birth: form.date_of_birth || null, blood_group: form.blood_group || null,
        father_name: form.father_name || null, mother_name: form.mother_name || null, father_phone: form.father_phone || null,
        address: form.address || null, city: form.city || null, state: form.state || null, pincode: form.pincode || null,
        class_id: form.class_id || null, section_id: form.section_id || null,
      }).eq("id", selectedStudent.id);
      if (error) throw error;
      toast.success("Student updated"); setEditOpen(false); fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
    setSaving(false);
  };

  const openEdit = (s: any) => {
    setSelectedStudent(s);
    setForm({
      admission_number: getMasterField(s, "admission_number") || "", name: getMasterField(s, "name") || "",
      gender: getMasterField(s, "gender") || "", date_of_birth: getMasterField(s, "date_of_birth") || "",
      blood_group: getMasterField(s, "blood_group") || "", father_name: getMasterField(s, "father_name") || "",
      mother_name: getMasterField(s, "mother_name") || "", father_phone: getMasterField(s, "father_phone") || "",
      address: getMasterField(s, "address") || "", city: getMasterField(s, "city") || "",
      state: getMasterField(s, "state") || "", pincode: getMasterField(s, "pincode") || "",
      admission_date: s.admission_date || "", class_id: s.class_id || "", section_id: s.section_id || "",
      academic_year_id: s.academic_year_id || "",
    });
    setEditOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!accountForm.email.trim() || !accountForm.password.trim()) {
      toast.error("Email and password are required"); return;
    }
    if (accountForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const studentName = getMasterField(selectedStudent, "name");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountForm.email, password: accountForm.password,
        options: { data: { full_name: studentName } },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user");

      await supabase.from("user_roles").insert({ user_id: userId, role: "student" });
      await supabase.from("students").update({ user_id: userId }).eq("id", selectedStudent.id);
      // Also update master record
      if (selectedStudent.student_master_id) {
        await supabase.from("student_master" as any).update({ user_id: userId } as any).eq("id", selectedStudent.student_master_id);
      }
      await supabase.from("profiles").update({ school_id: schoolId, full_name: studentName }).eq("user_id", userId);

      toast.success("Student login account created");
      setAccountOpen(false);
      setAccountForm({ email: "", password: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Student deleted"); fetchAll(); }
  };

  const filteredSections = sections.filter((s) => s.class_id === form.class_id);

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success", promoted: "bg-primary/10 text-primary",
    left: "bg-destructive/10 text-destructive", completed: "bg-muted text-muted-foreground",
  };

  const StudentFormFields = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Basic Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Admission Number *</Label><Input value={form.admission_number} onChange={(e) => setForm(p => ({ ...p, admission_number: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm(p => ({ ...p, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Blood Group</Label><Input value={form.blood_group} onChange={(e) => setForm(p => ({ ...p, blood_group: e.target.value }))} placeholder="e.g. O+" /></div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Family Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Father Name</Label><Input value={form.father_name} onChange={(e) => setForm(p => ({ ...p, father_name: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Mother Name</Label><Input value={form.mother_name} onChange={(e) => setForm(p => ({ ...p, mother_name: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Father Phone</Label><Input value={form.father_phone} onChange={(e) => setForm(p => ({ ...p, father_phone: e.target.value }))} /></div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Address</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} /></div>
          <div className="space-y-1"><Label>City</Label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} /></div>
          <div className="space-y-1"><Label>State</Label><Input value={form.state} onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm(p => ({ ...p, pincode: e.target.value }))} /></div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Academic Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Admission Date</Label><Input type="date" value={form.admission_date} onChange={(e) => setForm(p => ({ ...p, admission_date: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label>Academic Year *</Label>
            <Select value={form.academic_year_id} onValueChange={(v) => setForm(p => ({ ...p, academic_year_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Class</Label>
            <Select value={form.class_id} onValueChange={(v) => setForm(p => ({ ...p, class_id: v, section_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Section</Label>
            <Select value={form.section_id} onValueChange={(v) => setForm(p => ({ ...p, section_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>{filteredSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student records ({filteredStudents.length} total)</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or admission no..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adm. No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Father</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No students found</TableCell></TableRow>
            ) : (
              filteredStudents.map((s) => {
                const masterUserId = s.student_master?.user_id || s.user_id;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{getMasterField(s, "admission_number")}</TableCell>
                    <TableCell className="font-medium">{getMasterField(s, "name")}</TableCell>
                    <TableCell>{s.classes?.name || "—"}</TableCell>
                    <TableCell>{s.sections?.name || "—"}</TableCell>
                    <TableCell>{getMasterField(s, "father_name") || "—"}</TableCell>
                    <TableCell>
                      {masterUserId ? (
                        <Badge variant="outline" className="bg-success/10 text-success text-xs">Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">No account</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[s.status] || ""}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/school/students/profile?id=${s.id}`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        {!masterUserId && (
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(s); setAccountOpen(true); }} title="Create login account">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <StudentFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <StudentFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Student Login</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Create a login account for <strong>{getMasterField(selectedStudent, "name")}</strong> so they can access the Student Portal.</p>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Email</Label><Input value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Password</Label><Input type="password" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
