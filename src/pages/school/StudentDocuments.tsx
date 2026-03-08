import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Download, Trash2, FileText, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

const DOC_TYPES = ["Birth Certificate", "Transfer Certificate", "Aadhar Card", "Previous Marksheet", "Caste Certificate", "Photo ID", "Other"];

export default function StudentDocuments() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get("student_id");

  const [students, setStudents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(preselectedStudentId || "");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docType, setDocType] = useState("Birth Certificate");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    supabase.from("students").select("id, name, admission_number")
      .eq("school_id", schoolId).eq("status", "active").order("name")
      .then(({ data }) => {
        setStudents(data || []);
        setLoading(false);
      });
  }, [schoolId]);

  const fetchDocuments = async () => {
    if (!schoolId) return;
    let query = supabase.from("student_documents")
      .select("*, students(name, admission_number)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    if (selectedStudent) query = query.eq("student_id", selectedStudent);
    const { data } = await query;
    setDocuments(data || []);
  };

  useEffect(() => { fetchDocuments(); }, [schoolId, selectedStudent]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedStudent) {
      toast.error("Select student and file"); return;
    }
    // Validate file type and size
    const { validateFileUpload } = await import("@/lib/fileValidation");
    const validationError = validateFileUpload(selectedFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    const ext = selectedFile.name.split(".").pop();
    const path = `${schoolId}/${selectedStudent}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("student-documents").upload(path, selectedFile);

    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(path);

    const { error } = await supabase.from("student_documents").insert({
      school_id: schoolId!,
      student_id: selectedStudent,
      document_type: docType,
      file_name: selectedFile.name,
      file_url: urlData.publicUrl,
      uploaded_by: user?.id,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setSelectedFile(null);
      fetchDocuments();
    }
    setUploading(false);
  };

  const handleDelete = async (doc: any) => {
    // Extract path from URL
    const { error } = await supabase.from("student_documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message);
    else { toast.success("Document deleted"); fetchDocuments(); }
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  const filtered = documents.filter(d => {
    if (!search) return true;
    return d.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_type.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Documents</h1>
          <p className="text-muted-foreground">Upload and manage student documents securely</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64"><SelectValue placeholder="All Students" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No documents found</TableCell></TableRow>
            ) : (
              filtered.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.students?.name} <span className="text-xs text-muted-foreground">({doc.students?.admission_number})</span></TableCell>
                  <TableCell><Badge variant="secondary">{doc.document_type}</Badge></TableCell>
                  <TableCell className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {doc.file_name}</TableCell>
                  <TableCell>{format(new Date(doc.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_url, doc.file_name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Student *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>File</Label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose File</Button>
                {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile || !selectedStudent}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
