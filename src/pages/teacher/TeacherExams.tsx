import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

export default function TeacherExams() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", class_id: "", subject_id: "", exam_type: "exam",
    exam_date: "", total_marks: "100",
  });

  const fetchData = async () => {
    if (!user) return;
    const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user.id).maybeSingle();
    setTeacher(t);
    if (!t) { setLoading(false); return; }

    const [aRes, eRes] = await Promise.all([
      supabase.from("teacher_assignments").select("*, classes(id, name), subjects(id, name), academic_years(id, name, status)").eq("teacher_id", t.id),
      supabase.from("exams").select("*, classes(name), subjects(name)").eq("school_id", t.school_id).order("created_at", { ascending: false }),
    ]);
    setAssignments(aRes.data || []);
    setExams(eRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  const subjectsForClass = assignments
    .filter(a => a.class_id === form.class_id)
    .map(a => ({ id: a.subject_id, name: a.subjects?.name }));

  const activeYear = assignments.find(a => a.academic_years?.status === "active");

  const handleCreate = async () => {
    if (!teacher || !form.name || !form.class_id || !form.subject_id) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("exams").insert({
      school_id: teacher.school_id,
      academic_year_id: activeYear?.academic_year_id || assignments[0]?.academic_year_id,
      name: form.name,
      class_id: form.class_id,
      subject_id: form.subject_id,
      exam_type: form.exam_type,
      exam_mode: "offline",
      exam_date: form.exam_date || null,
      total_marks: parseFloat(form.total_marks) || 100,
      status: "draft",
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Exam created!");
      setDialogOpen(false);
      setForm({ name: "", class_id: "", subject_id: "", exam_type: "exam", exam_date: "", total_marks: "100" });
      fetchData();
    }
    setSaving(false);
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchData(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("exams").update({ status } as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Exam ${status}`); fetchData(); }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found.</div>;

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    published: "bg-primary/10 text-primary",
    rejected: "bg-destructive/15 text-destructive",
    completed: "bg-success/10 text-success",
  };

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    published: "Published",
    rejected: "Rejected",
    completed: "Completed",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Exams</h1>
          <p className="text-sm text-muted-foreground">Create exams, then submit them for admin review before students can take them</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Exam Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FA1 - Mathematics" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Class *</Label>
                  <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v, subject_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Subject *</Label>
                  <Select value={form.subject_id} onValueChange={v => setForm(p => ({ ...p, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Exam Type</Label>
                  <Select value={form.exam_type} onValueChange={v => setForm(p => ({ ...p, exam_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Total Marks</Label>
                  <Input type="number" value={form.total_marks} onChange={e => setForm(p => ({ ...p, total_marks: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Exam Date</Label>
                <Input type="date" value={form.exam_date} onChange={e => setForm(p => ({ ...p, exam_date: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No exams yet. Create one to start entering marks.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => {
            const status = (exam as any).status || "draft";
            return (
              <Card key={exam.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{exam.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteExam(exam.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">{(exam as any).classes?.name}</Badge>
                    <Badge variant="secondary" className="text-xs">{(exam as any).subjects?.name}</Badge>
                    <Badge className={`text-xs ${statusColor[status] || ""}`}>{statusLabel[status] || status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <p>Type: {exam.exam_type} · Marks: {(exam as any).total_marks || 100}</p>
                    {(exam as any).exam_date && <p>📅 {(exam as any).exam_date}</p>}
                    {status === "rejected" && (exam as any).review_notes && (
                      <p className="mt-1 text-destructive">Admin: {(exam as any).review_notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(status === "draft" || status === "rejected") && (
                      <Button size="sm" variant="default" onClick={() => updateStatus(exam.id, "pending_review")}>
                        Submit for Review
                      </Button>
                    )}
                    {status === "pending_review" && (
                      <Badge variant="outline" className="text-xs">Awaiting admin approval</Badge>
                    )}
                    {status === "published" && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(exam.id, "completed")}>Mark Completed</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
