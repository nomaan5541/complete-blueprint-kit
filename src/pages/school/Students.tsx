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
import { Plus, Loader2, Search, Eye, Trash2 } from "lucide-react";

export default function Students() {
  const { schoolId } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [form, setForm] = useState({
    admission_number: "", name: "", gender: "", date_of_birth: "", blood_group: "",
    father_name: "", mother_name: "", father_phone: "",
    address: "", city: "", state: "", pincode: "",
    admission_date: "", class_id: "", section_id: "", academic_year_id: "",
  });

  const fetchAll = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [studRes, clsRes, secRes, yrRes] = await Promise.all([
      supabase.from("students").select("*, classes(name), sections(name), academic_years(name)").eq("school_id", schoolId).order("name"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).order("start_date", { ascending: false }),
    ]);
    setStudents(studRes.data || []);
    setClasses(clsRes.data || []);
    setSections(secRes.data || []);
    setAcademicYears(yrRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const filteredStudents = students.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.admission_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter !== "all" && s.class_id !== classFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.admission_number.trim() || !form.academic_year_id) {
      toast.error("Name, admission number, and academic year are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("students").insert({
      school_id: schoolId!,
      admission_number: form.admission_number.trim(),
      name: form.name.trim(),
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group || null,
      father_name: form.father_name || null,
      mother_name: form.mother_name || null,
      father_phone: form.father_phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      admission_date: form.admission_date || null,
      class_id: form.class_id || null,
      section_id: form.section_id || null,
      academic_year_id: form.academic_year_id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Student added");
      setOpen(false);
      setForm({ admission_number: "", name: "", gender: "", date_of_birth: "", blood_group: "", father_name: "", mother_name: "", father_phone: "", address: "", city: "", state: "", pincode: "", admission_date: "", class_id: "", section_id: "", academic_year_id: "" });
      fetchAll();
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
    active: "bg-success/10 text-success",
    promoted: "bg-primary/10 text-primary",
    left: "bg-destructive/10 text-destructive",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student records</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No students found</TableCell></TableRow>
            ) : (
              filteredStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.classes?.name || "—"}</TableCell>
                  <TableCell>{s.sections?.name || "—"}</TableCell>
                  <TableCell>{s.father_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[s.status] || ""}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(s); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Detail label="Adm. No." value={selectedStudent.admission_number} />
                <Detail label="Name" value={selectedStudent.name} />
                <Detail label="Gender" value={selectedStudent.gender} />
                <Detail label="DOB" value={selectedStudent.date_of_birth} />
                <Detail label="Blood Group" value={selectedStudent.blood_group} />
                <Detail label="Class" value={selectedStudent.classes?.name} />
                <Detail label="Section" value={selectedStudent.sections?.name} />
                <Detail label="Academic Year" value={selectedStudent.academic_years?.name} />
                <Detail label="Father" value={selectedStudent.father_name} />
                <Detail label="Mother" value={selectedStudent.mother_name} />
                <Detail label="Father Phone" value={selectedStudent.father_phone} />
                <Detail label="Status" value={selectedStudent.status} />
              </div>
              {selectedStudent.address && (
                <div><span className="text-muted-foreground">Address: </span><span>{[selectedStudent.address, selectedStudent.city, selectedStudent.state, selectedStudent.pincode].filter(Boolean).join(", ")}</span></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
