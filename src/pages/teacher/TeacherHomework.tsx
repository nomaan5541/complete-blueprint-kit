import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TeacherHomework() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    class_id: "", subject_id: "", title: "", description: "", due_date: "",
  });

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const [aRes, hRes] = await Promise.all([
        supabase.from("teacher_assignments").select("*, classes(id, name), subjects(id, name), academic_years(id, name, status)").eq("teacher_id", t.id),
        supabase.from("homework" as any).select("*, classes(name), subjects(name)").eq("teacher_id", t.id).order("created_at", { ascending: false }),
      ]);
      setAssignments(aRes.data || []);
      setHomework((hRes.data as any[]) || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  const subjectsForClass = assignments
    .filter(a => a.class_id === form.class_id)
    .map(a => ({ id: a.subject_id, name: a.subjects?.name }));

  const activeYear = assignments.find(a => a.academic_years?.status === "active");

  const handleCreate = async () => {
    if (!teacher || !form.class_id || !form.subject_id || !form.title || !form.due_date) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("homework" as any).insert({
      school_id: teacher.school_id,
      academic_year_id: activeYear?.academic_year_id || assignments[0]?.academic_year_id,
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: teacher.id,
      title: form.title,
      description: form.description || null,
      due_date: form.due_date,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Homework assigned!");
      setDialogOpen(false);
      setForm({ class_id: "", subject_id: "", title: "", description: "", due_date: "" });
      // Refresh
      const { data } = await supabase.from("homework" as any).select("*, classes(name), subjects(name)").eq("teacher_id", teacher.id).order("created_at", { ascending: false });
      setHomework((data as any[]) || []);
    }
    setSaving(false);
  };

  const deleteHomework = async (id: string) => {
    const { error } = await supabase.from("homework" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setHomework(prev => prev.filter(h => h.id !== id));
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homework</h1>
          <p className="text-muted-foreground">Assign and manage homework for your classes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Assign Homework</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Class *</Label>
                <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v, subject_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Select value={form.subject_id} onValueChange={v => setForm(p => ({ ...p, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Chapter 5 exercises" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed instructions..." rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {homework.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No homework assigned yet. Click "Assign Homework" to get started.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homework.map((hw: any) => {
            const isPast = new Date(hw.due_date) < new Date();
            return (
              <Card key={hw.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{hw.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHomework(hw.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">{hw.classes?.name}</Badge>
                    <Badge variant="secondary" className="text-xs">{hw.subjects?.name}</Badge>
                    <Badge variant={isPast ? "destructive" : "outline"} className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(hw.due_date), "dd MMM yyyy")}
                    </Badge>
                  </div>
                </CardHeader>
                {hw.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{hw.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
