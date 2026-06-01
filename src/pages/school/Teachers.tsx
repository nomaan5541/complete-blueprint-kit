import { useEffect, useState } from "react";
import { SkeletonTableRows } from "@/components/loaders/PremiumLoader";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, Search, Trash2, Link, Pencil, UserPlus, AlertTriangle } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Teachers() {
  const { schoolId } = useSchool();
  const { canAddTeachers, currentTeachers, maxTeachers, teachersRemaining, planName } = usePlanLimits(schoolId);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ class_id: "", subject_id: "", academic_year_id: "" });
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const emptyForm = { name: "", gender: "", phone: "", email: "", qualification: "", joining_date: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [tRes, cRes, sRes, yRes, aRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).order("start_date", { ascending: false }),
      supabase.from("teacher_assignments").select("*, classes(name), subjects(name), academic_years(name)").eq("school_id", schoolId),
    ]);
    setTeachers(tRes.data || []);
    setClasses(cRes.data || []);
    setSubjects(sRes.data || []);
    setAcademicYears(yRes.data || []);
    setAssignments(aRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const filtered = teachers.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!canAddTeachers()) {
      toast.error(`Teacher limit reached! Your ${planName || "plan"} allows max ${maxTeachers} teachers. Please upgrade your plan.`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("teachers").insert({
      school_id: schoolId!, name: form.name.trim(),
      gender: form.gender || null, phone: form.phone || null, email: form.email || null,
      qualification: form.qualification || null, joining_date: form.joining_date || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Teacher added"); setOpen(false); setForm(emptyForm); fetchAll(); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedTeacher || !form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("teachers").update({
      name: form.name.trim(), gender: form.gender || null, phone: form.phone || null,
      email: form.email || null, qualification: form.qualification || null, joining_date: form.joining_date || null,
    }).eq("id", selectedTeacher.id);
    if (error) toast.error(error.message);
    else { toast.success("Teacher updated"); setEditOpen(false); fetchAll(); }
    setSaving(false);
  };

  const openEdit = (t: any) => {
    setSelectedTeacher(t);
    setForm({
      name: t.name || "", gender: t.gender || "", phone: t.phone || "",
      email: t.email || "", qualification: t.qualification || "", joining_date: t.joining_date || "",
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
      const { data, error } = await supabase.functions.invoke("create-user-account", {
        body: {
          email: accountForm.email,
          password: accountForm.password,
          fullName: selectedTeacher.name,
          role: "teacher",
          schoolId,
          teacherId: selectedTeacher.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Teacher login account created");
      setAccountOpen(false);
      setAccountForm({ email: "", password: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!selectedTeacherId || !assignForm.class_id || !assignForm.subject_id || !assignForm.academic_year_id) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("teacher_assignments").insert({
      school_id: schoolId!, teacher_id: selectedTeacherId,
      class_id: assignForm.class_id, subject_id: assignForm.subject_id, academic_year_id: assignForm.academic_year_id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Assignment created"); setAssignOpen(false); setAssignForm({ class_id: "", subject_id: "", academic_year_id: "" }); fetchAll(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Teacher deleted"); fetchAll(); }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Assignment removed"); fetchAll(); }
  };

  const teacherFormFields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
      <div className="space-y-1">
        <Label>Gender</Label>
        <Select value={form.gender} onValueChange={(v) => setForm(p => ({ ...p, gender: v }))}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm(p => ({ ...p, qualification: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={(e) => setForm(p => ({ ...p, joining_date: e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground text-sm">Manage teaching staff ({filtered.length} total)</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
      </div>

      <div className="relative max-w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-responsive rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Qualification</TableHead>
              <TableHead className="hidden md:table-cell">Assignments</TableHead>
              <TableHead className="hidden sm:table-cell">Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonTableRows rows={6} colSpan={8} />
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No teachers found</TableCell></TableRow>
            ) : (
              filtered.map((t) => {
                const teacherAssignments = assignments.filter((a) => a.teacher_id === t.id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{t.email || ""}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{t.email || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{t.phone || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{t.qualification || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {teacherAssignments.length === 0 ? (
                          <span className="text-muted-foreground text-xs">None</span>
                        ) : (
                          teacherAssignments.map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-xs gap-1">
                              {a.classes?.name} - {a.subjects?.name}
                              <button onClick={() => deleteAssignment(a.id)} className="ml-0.5 text-destructive hover:text-destructive/80">×</button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {t.user_id ? (
                        <Badge variant="outline" className="bg-success/10 text-success text-xs">Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">No account</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedTeacherId(t.id); setAssignOpen(true); }} title="Assign to class">
                          <Link className="h-4 w-4" />
                        </Button>
                        {!t.user_id && (
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedTeacher(t); setAccountOpen(true); }} title="Create login account">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Teacher</DialogTitle></DialogHeader>
          {teacherFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
          {teacherFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Teacher Login</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Create a login account for <strong>{selectedTeacher?.name}</strong> so they can access the Teacher Portal.</p>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} placeholder="teacher@email.com" /></div>
            <div className="space-y-1"><Label>Password</Label><Input type="password" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Teacher to Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Academic Year</Label>
              <Select value={assignForm.academic_year_id} onValueChange={(v) => setAssignForm(p => ({ ...p, academic_year_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={assignForm.class_id} onValueChange={(v) => setAssignForm(p => ({ ...p, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Select value={assignForm.subject_id} onValueChange={(v) => setAssignForm(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
