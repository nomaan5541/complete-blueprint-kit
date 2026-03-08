import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Loader2, UserMinus } from "lucide-react";

export default function StudentTransfer() {
  const { schoolId } = useSchool();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [transferForm, setTransferForm] = useState({ status: "transferred", reason: "", leaving_date: new Date().toISOString().slice(0, 10) });

  const fetchStudents = async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data } = await supabase.from("students")
      .select("*, classes(name), sections(name), academic_years(name), student_master(id, name, admission_number)")
      .eq("school_id", schoolId)
      .in("status", ["active", "transferred", "left", "completed"])
      .order("name");
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [schoolId]);

  const getName = (s: any) => s.student_master?.name || s.name;
  const getAdmNo = (s: any) => s.student_master?.admission_number || s.admission_number;

  const filtered = students.filter(s => {
    if (!search) return true;
    return getName(s).toLowerCase().includes(search.toLowerCase()) || getAdmNo(s).toLowerCase().includes(search.toLowerCase());
  });

  const openTransfer = (s: any) => {
    setSelectedStudent(s);
    setTransferForm({ status: "transferred", reason: "", leaving_date: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    // Update year record
    const { error } = await supabase.from("students").update({ status: transferForm.status }).eq("id", selectedStudent.id);
    if (error) { toast.error(error.message); setSaving(false); return; }

    // Also update master record status
    if (selectedStudent.student_master_id) {
      await supabase.from("student_master" as any).update({ status: transferForm.status } as any).eq("id", selectedStudent.student_master_id);
    }

    toast.success(`Student status updated to ${transferForm.status}`);
    setOpen(false);
    fetchStudents();
    setSaving(false);
  };

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success", transferred: "bg-warning/10 text-warning",
    left: "bg-destructive/10 text-destructive", completed: "bg-primary/10 text-primary",
    promoted: "bg-primary/10 text-primary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Transfer / Leaving</h1>
        <p className="text-muted-foreground">Manage student transfers, leaving, and status changes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{students.filter(s => s.status === "active").length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-warning">{students.filter(s => s.status === "transferred").length}</p><p className="text-xs text-muted-foreground">Transferred</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-destructive">{students.filter(s => s.status === "left").length}</p><p className="text-xs text-muted-foreground">Left</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-primary">{students.filter(s => s.status === "completed").length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or admission no..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adm No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No students</TableCell></TableRow>
            ) : (
              filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{getAdmNo(s)}</TableCell>
                  <TableCell className="font-medium">{getName(s)}</TableCell>
                  <TableCell>{s.classes?.name || "—"}</TableCell>
                  <TableCell>{s.academic_years?.name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[s.status] || ""}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {s.status === "active" && (
                      <Button variant="outline" size="sm" onClick={() => openTransfer(s)}>
                        <UserMinus className="h-3.5 w-3.5 mr-1" /> Change Status
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Student Status</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Student: <strong>{getName(selectedStudent)}</strong> ({getAdmNo(selectedStudent)})</p>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>New Status</Label>
              <Select value={transferForm.status} onValueChange={v => setTransferForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="left">Left School</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Leaving Date</Label>
              <Input type="date" value={transferForm.leaving_date} onChange={e => setTransferForm(p => ({ ...p, leaving_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Textarea value={transferForm.reason} onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))} placeholder="Optional reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTransfer} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
