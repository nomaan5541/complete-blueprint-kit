import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  academicYearId: string;
  classes: any[];
  subjects: any[];
  onCreated: () => void;
}

const EXAM_TYPES = [
  { value: "FA1", label: "FA1 (Formative 1)" },
  { value: "FA2", label: "FA2 (Formative 2)" },
  { value: "MID", label: "Mid Term" },
  { value: "FA3", label: "FA3 (Formative 3)" },
  { value: "FA4", label: "FA4 (Formative 4)" },
  { value: "FINAL", label: "Final Exam" },
  { value: "unit_test", label: "Unit Test" },
  { value: "custom", label: "Custom" },
];

export default function ExamCreateDialog({ open, onOpenChange, schoolId, academicYearId, classes, subjects, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", exam_type: "FA1", exam_mode: "offline",
    class_id: "", subject_id: "", start_date: "", end_date: "",
    duration_minutes: "", total_marks: "100", instructions: "",
  });

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Exam name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("exams").insert({
      school_id: schoolId,
      name: form.name.trim(),
      exam_type: form.exam_type,
      academic_year_id: academicYearId,
      exam_date: form.start_date || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      exam_mode: form.exam_mode,
      class_id: form.class_id || null,
      subject_id: form.subject_id || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      total_marks: parseFloat(form.total_marks) || 100,
      instructions: form.instructions || null,
      status: "draft",
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Exam created");
      onOpenChange(false);
      setForm({ name: "", exam_type: "FA1", exam_mode: "offline", class_id: "", subject_id: "", start_date: "", end_date: "", duration_minutes: "", total_marks: "100", instructions: "" });
      onCreated();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Exam Mode</Label>
              <Select value={form.exam_mode} onValueChange={v => setForm(p => ({ ...p, exam_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">📝 Offline</SelectItem>
                  <SelectItem value="online">💻 Online (MCQ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Exam Type</Label>
              <Select value={form.exam_type} onValueChange={v => setForm(p => ({ ...p, exam_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Exam Name</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FA1 - Mathematics Class 5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject {form.exam_mode === "online" ? "(Required)" : "(Optional)"}</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Exam Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            {form.exam_mode === "online" && (
              <div className="space-y-1"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Total Marks</Label><Input type="number" value={form.total_marks} onChange={e => setForm(p => ({ ...p, total_marks: e.target.value }))} /></div>
            {form.exam_mode === "online" && (
              <div className="space-y-1"><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="e.g. 60" /></div>
            )}
          </div>

          {form.exam_mode === "online" && (
            <div className="space-y-1">
              <Label>Instructions</Label>
              <Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Instructions for students..." rows={3} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Exam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
