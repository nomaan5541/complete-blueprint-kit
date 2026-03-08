import { useEffect, useState } from "react";
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
import { Plus, Loader2, Search, Trash2, Link } from "lucide-react";

export default function Teachers() {
  const { schoolId } = useSchool();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assignForm, setAssignForm] = useState({ class_id: "", subject_id: "", academic_year_id: "" });
  const [form, setForm] = useState({
    name: "", gender: "", phone: "", email: "", qualification: "", joining_date: "",
  });

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
    setSaving(true);
    const { error } = await supabase.from("teachers").insert({
      school_id: schoolId!,
      name: form.name.trim(),
      gender: form.gender || null,
      phone: form.phone || null,
      email: form.email || null,
      qualification: form.qualification || null,
      joining_date: form.joining_date || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Teacher added");
      setOpen(false);
      setForm({ name: "", gender: "", phone: "", email: "", qualification: "", joining_date: "" });
      fetchAll();
    }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!selectedTeacherId || !assignForm.class_id || !assignForm.subject_id || !assignForm.academic_year_id) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("teacher_assignments").insert({
      school_id: schoolId!,
      teacher_id: selectedTeacherId,
      class_id: assignForm.class_id,
      subject_id: assignForm.subject_id,
      academic_year_id: assignForm.academic_year_id,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">Manage teaching staff</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No teachers found</TableCell></TableRow>
            ) : (
              filtered.map((t) => {
                const teacherAssignments = assignments.filter((a) => a.teacher_id === t.id);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.email || "—"}</TableCell>
                    <TableCell>{t.phone || "—"}</TableCell>
                    <TableCell>{t.qualification || "—"}</TableCell>
                    <TableCell>
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
                    <TableCell>
                      <Badge variant="outline" className={t.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedTeacherId(t.id); setAssignOpen(true); }} title="Assign to class">
                          <Link className="h-4 w-4" />
                        </Button>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Teacher</Button>
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
