import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Video, Plus, Loader2, ExternalLink, Trash2, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export default function TeacherMeetings() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", class_id: "", section_id: "", subject_id: "",
    academic_year_id: "", scheduled_start: "", scheduled_end: "",
  });

  const fetchData = async () => {
    if (!schoolId || !user) return;
    setLoading(true);

    const { data: teacher } = await supabase
      .from("teachers").select("id").eq("user_id", user.id).eq("school_id", schoolId).maybeSingle();
    
    if (!teacher) { setLoading(false); return; }
    setTeacherId(teacher.id);

    const [mRes, cRes, sRes, secRes, yRes] = await Promise.all([
      supabase.from("meetings").select("*, classes(name), subjects(name), sections(name), academic_years(name)")
        .eq("teacher_id", teacher.id).order("scheduled_start", { ascending: false }),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).eq("status", "active").order("start_date", { ascending: false }),
    ]);

    setMeetings(mRes.data || []);
    setClasses(cRes.data || []);
    setSubjects(sRes.data || []);
    setSections(secRes.data || []);
    setAcademicYears(yRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [schoolId, user]);

  const handleStartLiveClass = async () => {
    if (!form.title.trim() || !form.academic_year_id || !form.scheduled_start) {
      toast.error("Title, academic year, and start time are required"); return;
    }
    setSaving(true);

    const meetLink = "https://meet.google.com/new";

    const { error } = await supabase.from("meetings").insert({
      school_id: schoolId!,
      teacher_id: teacherId!,
      title: form.title.trim(),
      description: form.description || null,
      meet_link: meetLink,
      class_id: form.class_id || null,
      section_id: form.section_id || null,
      subject_id: form.subject_id || null,
      academic_year_id: form.academic_year_id,
      scheduled_start: form.scheduled_start,
      scheduled_end: form.scheduled_end || null,
      status: "live",
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Live class started!");
      window.open(meetLink, "_blank");
      setOpen(false);
      setForm({ title: "", description: "", class_id: "", section_id: "", subject_id: "", academic_year_id: "", scheduled_start: "", scheduled_end: "" });
      fetchData();
    }
    setSaving(false);
  };

  const handleEndMeeting = async (id: string) => {
    const { error } = await supabase.from("meetings").update({ status: "ended" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Meeting ended"); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Meeting deleted"); fetchData(); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-green-500/15 text-green-700 border-green-300";
      case "scheduled": return "bg-blue-500/15 text-blue-700 border-blue-300";
      case "ended": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive/15 text-destructive";
      default: return "";
    }
  };

  const filteredSections = sections.filter(s => s.class_id === form.class_id);

  const liveMeetings = meetings.filter(m => m.status === "live");
  const scheduledMeetings = meetings.filter(m => m.status === "scheduled");
  const pastMeetings = meetings.filter(m => m.status === "ended" || m.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground text-sm">Start live classes & manage virtual meetings</p>
        </div>
        <Button onClick={() => {
          setForm(f => ({ ...f, scheduled_start: new Date().toISOString().slice(0, 16) }));
          setOpen(true);
        }} className="w-full sm:w-auto">
          <Video className="mr-2 h-4 w-4" /> Start Live Class
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {/* Live Now */}
          {liveMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" /> Live Now
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liveMeetings.map(m => (
                  <Card key={m.id} className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <Badge className={getStatusColor("live")}>Live</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.classes?.name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {m.classes.name}{m.sections?.name ? ` - ${m.sections.name}` : ""}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Started {format(new Date(m.scheduled_start), "hh:mm a")}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" asChild className="flex-1">
                          <a href={m.meet_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Rejoin
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEndMeeting(m.id)}>End</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled */}
          {scheduledMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Scheduled</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduledMeetings.map(m => (
                  <Card key={m.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor("scheduled")}>Scheduled</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.classes?.name && (
                        <p className="text-sm text-muted-foreground">{m.classes.name}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}</p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(m.scheduled_start), "MMM d, hh:mm a")}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" asChild className="flex-1" onClick={async () => {
                          await supabase.from("meetings").update({ status: "live" }).eq("id", m.id);
                          fetchData();
                        }}>
                          <a href={m.meet_link} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-1 h-3.5 w-3.5" /> Start
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Past Meetings</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pastMeetings.slice(0, 9).map(m => (
                  <Card key={m.id} className="opacity-70">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor(m.status)}>{m.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.scheduled_start), "MMM d, yyyy • hh:mm a")}
                      </p>
                      {m.classes?.name && <p className="text-xs text-muted-foreground mt-1">{m.classes.name}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No meetings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Click "Start Live Class" to create your first Google Meet session</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Start Live Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input placeholder="e.g. Math Class - Chapter 5" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Academic Year *</Label>
                <Select value={form.academic_year_id} onValueChange={v => setForm(f => ({ ...f, academic_year_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v, section_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {filteredSections.length > 0 && (
                <div className="space-y-1">
                  <Label>Section</Label>
                  <Select value={form.section_id} onValueChange={v => setForm(f => ({ ...f, section_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                    <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Start Time *</Label>
                <Input type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input type="datetime-local" value={form.scheduled_end} onChange={e => setForm(f => ({ ...f, scheduled_end: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-lg border border-dashed p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                📹 Clicking "Start & Open Meet" will create the meeting record and open <strong>Google Meet</strong> in a new tab where your class will be hosted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleStartLiveClass} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
              Start & Open Meet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
