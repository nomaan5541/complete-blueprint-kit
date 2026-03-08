import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, Plus, Loader2, Send } from "lucide-react";
import { format } from "date-fns";

export default function TeacherNotifications() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_class_id: "" });

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      const [aRes, nRes] = await Promise.all([
        supabase.from("teacher_assignments").select("*, classes(id, name)").eq("teacher_id", t.id),
        supabase.from("notifications").select("*").eq("school_id", t.school_id).order("created_at", { ascending: false }).limit(30),
      ]);
      setAssignments(aRes.data || []);
      setNotifications(nRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const uniqueClasses = assignments.reduce((acc: any[], a) => {
    if (!acc.find(c => c.id === a.class_id)) acc.push({ id: a.class_id, name: a.classes?.name });
    return acc;
  }, []);

  const handleSend = async () => {
    if (!teacher || !form.title || !form.message) {
      toast.error("Fill title and message"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("notifications").insert({
      school_id: teacher.school_id,
      title: form.title,
      message: form.message,
      type: "announcement",
      target_class_id: form.target_class_id || null,
      target_role: "student",
      created_by: user!.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Notification sent!");
      setDialogOpen(false);
      setForm({ title: "", message: "", target_class_id: "" });
      const { data } = await supabase.from("notifications").select("*").eq("school_id", teacher.school_id).order("created_at", { ascending: false }).limit(30);
      setNotifications(data || []);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher profile found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">View and send class announcements</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Send className="mr-2 h-4 w-4" /> Send Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Target Class (optional)</Label>
                <Select value={form.target_class_id} onValueChange={v => setForm(p => ({ ...p, target_class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
              </div>
              <div className="space-y-1">
                <Label>Message *</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your message..." rows={4} />
              </div>
              <Button onClick={handleSend} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> All Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{n.type}</Badge>
                  {n.created_by === user!.id && <Badge variant="secondary" className="text-xs">By You</Badge>}
                  <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd MMM yyyy, hh:mm a")}</span>
                </div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
