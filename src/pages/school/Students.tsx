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
import { Plus, Loader2, Search, Eye, Trash2, Pencil, UserPlus, ScanFace } from "lucide-react";
import StudentFormTabs, { emptyStudentForm, type StudentFormData } from "@/components/students/StudentFormTabs";
import { FaceEnrollment } from "@/components/FaceEnrollment";

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
  const [faceOpen, setFaceOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [form, setForm] = useState<StudentFormData>(emptyStudentForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documentUploads, setDocumentUploads] = useState<Record<string, File | null>>({});

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleDocumentChange = (docType: string, file: File | null) => {
    setDocumentUploads(prev => ({ ...prev, [docType]: file }));
  };

  const fetchAll = async () => {
    if (!schoolId || !selectedYearId) return;
    setLoading(true);
    const [studRes, clsRes, secRes] = await Promise.all([
      supabase.from("students").select("*, classes(name), sections(name), academic_years(name), student_master(id, name, father_name, admission_number, gender, date_of_birth, blood_group, mother_name, father_phone, address, city, state, pincode, photo_url, user_id, status)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).order("name"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
    ]);
    setStudents(studRes.data || []);
    setClasses(clsRes.data || []);
    setSections(secRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId, selectedYearId]);

  const getMasterField = (s: any, field: string) => s?.student_master?.[field] || s?.[field];

  const filteredStudents = students.filter((s) => {
    const name = getMasterField(s, "name");
    const admNo = getMasterField(s, "admission_number");
    if (search && !name?.toLowerCase().includes(search.toLowerCase()) && !admNo?.toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter !== "all" && s.class_id !== classFilter) return false;
    return true;
  });

  const allFormFields = (f: StudentFormData) => ({
    admission_number: f.admission_number.trim(), name: f.name.trim(),
    gender: f.gender || null, date_of_birth: f.date_of_birth || null,
    blood_group: f.blood_group || null, father_name: f.father_name || null,
    mother_name: f.mother_name || null, father_phone: f.father_phone || null,
    address: f.address || null, city: f.city || null, state: f.state || null,
    pincode: f.pincode || null, admission_date: f.admission_date || null,
    roll_number: f.roll_number || null, phone: f.phone || null,
    pen_number: f.pen_number || null, bio: f.bio || null,
    medium_of_instruction: f.medium_of_instruction || null,
    second_language: f.second_language || null, previous_school: f.previous_school || null,
    previous_class_passed: f.previous_class_passed || null, tc_number: f.tc_number || null,
    joining_date: f.joining_date || null, elective_subjects: f.elective_subjects || null,
    scholarship_category: f.scholarship_category || null, caste_category: f.caste_category || null,
    father_occupation: f.father_occupation || null, mother_occupation: f.mother_occupation || null,
    guardian_name: f.guardian_name || null, guardian_relation: f.guardian_relation || null,
    guardian_phone: f.guardian_phone || null, alternate_contact: f.alternate_contact || null,
    family_annual_income: f.family_annual_income || null, parent_email: f.parent_email || null,
  });

  const uploadDocuments = async (studentId: string) => {
    for (const [docType, file] of Object.entries(documentUploads)) {
      if (!file) continue;
      const ext = file.name.split(".").pop();
      const path = `${schoolId}/${studentId}/${docType.replace(/\s+/g, "_")}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("student-documents").upload(path, file, { upsert: true });
      if (uploadErr) { toast.error(`Failed to upload ${docType}`); continue; }
      const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(path);
      await supabase.from("student_documents").insert({
        school_id: schoolId!, student_id: studentId, document_type: docType,
        file_name: file.name, file_url: urlData.publicUrl,
      });
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.admission_number.trim() || !form.academic_year_id) {
      toast.error("Name, admission number, and academic year are required"); return;
    }
    setSaving(true);
    try {
      const fields = allFormFields(form);
      // Master record
      const { data: existingMaster } = await supabase.from("student_master" as any)
        .select("id").eq("school_id", schoolId!).eq("admission_number", fields.admission_number).maybeSingle();

      let masterId: string;
      if (existingMaster) {
        masterId = (existingMaster as any).id;
        await supabase.from("student_master" as any).update(fields as any).eq("id", masterId);
      } else {
        const { data: newMaster, error: masterErr } = await supabase.from("student_master" as any)
          .insert({ school_id: schoolId!, ...fields } as any).select("id").single();
        if (masterErr) throw masterErr;
        masterId = (newMaster as any).id;
      }

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${schoolId}/${masterId}/photo.${ext}`;
        await supabase.storage.from("student-documents").upload(path, photoFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(path);
        await supabase.from("student_master" as any).update({ photo_url: urlData.publicUrl } as any).eq("id", masterId);
      }

      // Year record
      const { data: studentData, error } = await supabase.from("students").insert({
        school_id: schoolId!, ...fields, class_id: form.class_id || null,
        section_id: form.section_id || null, academic_year_id: form.academic_year_id,
        student_master_id: masterId,
      }).select("id").single();
      if (error) throw error;

      // Upload documents
      if (studentData) await uploadDocuments(studentData.id);

      toast.success("Student added");
      setOpen(false); setForm(emptyStudentForm);
      setPhotoFile(null); setPhotoPreview(null); setDocumentUploads({});
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add student");
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedStudent || !form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const fields = allFormFields(form);
      if (selectedStudent.student_master_id) {
        await supabase.from("student_master" as any).update(fields as any).eq("id", selectedStudent.student_master_id);
      }
      const { error } = await supabase.from("students").update({
        ...fields, class_id: form.class_id || null, section_id: form.section_id || null,
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
      admission_number: getMasterField(s, "admission_number") || "",
      name: getMasterField(s, "name") || "",
      gender: getMasterField(s, "gender") || "",
      date_of_birth: getMasterField(s, "date_of_birth") || "",
      blood_group: getMasterField(s, "blood_group") || "",
      father_name: getMasterField(s, "father_name") || "",
      mother_name: getMasterField(s, "mother_name") || "",
      father_phone: getMasterField(s, "father_phone") || "",
      address: getMasterField(s, "address") || "",
      city: getMasterField(s, "city") || "",
      state: getMasterField(s, "state") || "",
      pincode: getMasterField(s, "pincode") || "",
      admission_date: s.admission_date || "",
      class_id: s.class_id || "",
      section_id: s.section_id || "",
      academic_year_id: s.academic_year_id || "",
      roll_number: s.roll_number || "",
      phone: s.phone || "",
      pen_number: s.pen_number || "",
      bio: s.bio || "",
      medium_of_instruction: s.medium_of_instruction || "",
      second_language: s.second_language || "",
      previous_school: s.previous_school || "",
      previous_class_passed: s.previous_class_passed || "",
      tc_number: s.tc_number || "",
      joining_date: s.joining_date || "",
      elective_subjects: s.elective_subjects || "",
      scholarship_category: s.scholarship_category || "",
      caste_category: s.caste_category || "",
      father_occupation: s.father_occupation || "",
      mother_occupation: s.mother_occupation || "",
      guardian_name: s.guardian_name || "",
      guardian_relation: s.guardian_relation || "",
      guardian_phone: s.guardian_phone || "",
      alternate_contact: s.alternate_contact || "",
      family_annual_income: s.family_annual_income || "",
      parent_email: s.parent_email || "",
      status: s.status || "active",
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
      const { data, error } = await supabase.functions.invoke("create-user-account", {
        body: {
          email: accountForm.email,
          password: accountForm.password,
          fullName: studentName,
          role: "student",
          schoolId,
          studentId: selectedStudent.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm">Manage student records ({filteredStudents.length} total)</p>
        </div>
        <Button onClick={() => {
          setForm({ ...emptyStudentForm, academic_year_id: selectedYearId });
          setPhotoFile(null); setPhotoPreview(null); setDocumentUploads({});
          setOpen(true);
        }} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or admission no..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="table-responsive rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adm. No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Class</TableHead>
              <TableHead className="hidden lg:table-cell">Section</TableHead>
              <TableHead className="hidden lg:table-cell">Father</TableHead>
              <TableHead className="hidden sm:table-cell">Account</TableHead>
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
                    <TableCell>
                      <div className="font-medium">{getMasterField(s, "name")}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{s.classes?.name || "—"}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{s.classes?.name || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{s.sections?.name || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getMasterField(s, "father_name") || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
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
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => { setSelectedStudent(s); setFaceOpen(true); }} title="Enroll face for AI attendance">
                          <ScanFace className="h-4 w-4" />
                        </Button>
                        {!masterUserId && (
                          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => { setSelectedStudent(s); setAccountOpen(true); }} title="Create login account">
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <StudentFormTabs
            form={form} setForm={setForm}
            classes={classes} sections={sections} academicYears={academicYears}
            filteredSections={filteredSections}
            photoFile={photoFile} onPhotoChange={handlePhotoChange} photoPreview={photoPreview}
            documentUploads={documentUploads} onDocumentChange={handleDocumentChange}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <StudentFormTabs
            form={form} setForm={setForm}
            classes={classes} sections={sections} academicYears={academicYears}
            filteredSections={filteredSections}
          />
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
