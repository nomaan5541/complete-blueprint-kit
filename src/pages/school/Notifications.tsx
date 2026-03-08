import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2, Bell, Megaphone } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "general", target_role: "all", target_class_id: "" });

  const fetchAll = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [nRes, cRes] = await Promise.all([
      supabase.from("notifications").select("*, classes(name)").eq("school_id", schoolId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
    ]);
    setNotifications(nRes.data || []);
    setClasses(cRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("notifications").insert({
      school_id: schoolId!,
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      target_role: form.target_role,
      target_class_id: form.target_class_id || null,
      created_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Notification sent"); setOpen(false); setForm({ title: "", message: "", type: "general", target_role: "all", target_class_id: "" }); fetchAll(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast.success("Deleted");
    fetchAll();
  };

  const typeColors: Record<string, string> = {
    exam: "bg-primary/10 text-primary",
    fee: "bg-warning/10 text-warning",
    holiday: "bg-success/10 text-success",
    general: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send announcements to students and teachers</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Notification</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : notifications.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />No notifications sent
              </TableCell></TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{n.message}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={typeColors[n.type] || ""}>{n.type}</Badge></TableCell>
                  <TableCell className="capitalize">{n.target_role}</TableCell>
                  <TableCell>{n.classes?.name || "All"}</TableCell>
                  <TableCell className="text-sm">{format(new Date(n.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)} className="text-destructive">Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Mid Term Exam Schedule" /></div>
            <div className="space-y-1"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="fee">Fee Reminder</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Target</Label>
                <Select value={form.target_role} onValueChange={(v) => setForm(p => ({ ...p, target_role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Specific Class (optional)</Label>
              <Select value={form.target_class_id} onValueChange={(v) => setForm(p => ({ ...p, target_class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
