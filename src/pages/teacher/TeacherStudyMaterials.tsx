import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Trash2, FileText, Video, BookOpen, ClipboardList, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MATERIAL_TYPES = [
  { value: "notes", label: "Notes", icon: FileText },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "assignment", label: "Assignment", icon: ClipboardList },
];

export default function TeacherStudyMaterials() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("notes");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(id, name), subjects(id, name)")
        .eq("teacher_id", t.id);
      setAssignments(assigns || []);

      await fetchMaterials(t.id);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const fetchMaterials = async (teacherId: string) => {
    const { data } = await supabase
      .from("study_materials")
      .select("*, classes(name), subjects(name)")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setMaterials(data || []);
  };

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  const subjectsForClass = assignments
    .filter(a => a.class_id === selectedClass)
    .map(a => ({ id: a.subject_id, name: a.subjects?.name }));

  const handleUpload = async () => {
    if (!title.trim() || !selectedClass || !selectedSubject || !teacher) {
      toast.error("Please fill all required fields");
      return;
    }

    setUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${teacher.school_id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("study-materials")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("study-materials").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      // Get active academic year
      const { data: ay } = await supabase
        .from("academic_years")
        .select("id")
        .eq("school_id", teacher.school_id)
        .eq("status", "active")
        .maybeSingle();

      if (!ay) {
        toast.error("No active academic year found");
        setUploading(false);
        return;
      }

      const { error } = await supabase.from("study_materials").insert({
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        class_id: selectedClass,
        subject_id: selectedSubject,
        academic_year_id: ay.id,
        title: title.trim(),
        description: description.trim() || null,
        material_type: materialType,
        file_url: fileUrl,
        file_name: fileName,
      });

      if (error) throw error;

      toast.success("Material uploaded successfully!");
      setDialogOpen(false);
      resetForm();
      await fetchMaterials(teacher.id);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Material deleted");
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMaterialType("notes");
    setSelectedClass("");
    setSelectedSubject("");
    setFile(null);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher profile found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Materials</h1>
          <p className="text-muted-foreground">Upload notes, PDFs, videos & assignments for your classes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Upload Material</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Notes" maxLength={200} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." maxLength={500} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Class *</Label>
                  <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSubject(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={materialType} onValueChange={setMaterialType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>File (PDF, doc, video, image)</Label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.jpg,.png,.jpeg" />
              </div>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5" /> Uploaded Materials ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No materials uploaded yet. Click "Upload Material" to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map(m => {
                  const typeInfo = MATERIAL_TYPES.find(t => t.value === m.material_type) || MATERIAL_TYPES[0];
                  const TypeIcon = typeInfo.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{m.title}</p>
                            {m.description && <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{typeInfo.label}</Badge></TableCell>
                      <TableCell>{m.classes?.name}</TableCell>
                      <TableCell>{m.subjects?.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(m.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {m.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={m.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
