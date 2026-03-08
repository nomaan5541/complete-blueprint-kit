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
import { Plus, Loader2, Trash2 } from "lucide-react";

export default function AcademicYears() {
  const { schoolId } = useSchool();
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });

  const fetchYears = async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: false });
    setYears(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchYears(); }, [schoolId]);

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("academic_years").insert({
      school_id: schoolId!,
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      status: "not_started",
    });
    if (error) toast.error(error.message);
    else { toast.success("Academic year created"); setOpen(false); setForm({ name: "", start_date: "", end_date: "" }); fetchYears(); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    // If activating, deactivate others first
    if (status === "active" && schoolId) {
      await supabase.from("academic_years").update({ status: "not_started" }).eq("school_id", schoolId).eq("status", "active");
    }
    const { error } = await supabase.from("academic_years").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Year ${status}`); fetchYears(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchYears(); }
  };

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success",
    archived: "bg-muted text-muted-foreground",
    not_started: "bg-warning/10 text-warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Years</h1>
          <p className="text-muted-foreground">Manage academic year cycles</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Year</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : years.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No academic years</TableCell></TableRow>
            ) : (
              years.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="font-medium">{y.name}</TableCell>
                  <TableCell>{y.start_date}</TableCell>
                  <TableCell>{y.end_date}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[y.status] || ""}>{y.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Select value={y.status} onValueChange={(v) => updateStatus(y.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(y.id)} className="text-destructive hover:text-destructive h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Academic Year</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name (e.g. 2025-2026)</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="2025-2026" /></div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
