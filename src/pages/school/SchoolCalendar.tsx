import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Calendar as CalendarIcon, GraduationCap, PartyPopper, Trophy } from "lucide-react";
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";

const EVENT_TYPES = [
  { value: "holiday", label: "Holiday", color: "bg-destructive/10 text-destructive" },
  { value: "exam", label: "Exam", color: "bg-warning/10 text-warning" },
  { value: "sports", label: "Sports", color: "bg-success/10 text-success" },
  { value: "annual", label: "Annual Day", color: "bg-primary/10 text-primary" },
  { value: "meeting", label: "Meeting", color: "bg-secondary text-secondary-foreground" },
  { value: "general", label: "General", color: "bg-muted text-muted-foreground" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function SchoolCalendar() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [form, setForm] = useState({ title: "", description: "", event_type: "general", start_date: "", end_date: "" });

  const fetchEvents = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("school_events")
      .select("*").eq("school_id", schoolId).order("start_date");
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [schoolId]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.start_date) { toast.error("Title and start date required"); return; }
    setSaving(true);
    const { error } = await supabase.from("school_events").insert({
      school_id: schoolId!,
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      created_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Event added"); setOpen(false); setForm({ title: "", description: "", event_type: "general", start_date: "", end_date: "" }); fetchEvents(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("school_events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchEvents(); }
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const getEventsForDay = (date: Date) => events.filter(e => {
    const start = parseISO(e.start_date);
    const end = e.end_date ? parseISO(e.end_date) : start;
    return date >= start && date <= end;
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const currentMonthEvents = events.filter(e => isSameMonth(parseISO(e.start_date), currentDate));
  const getTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[5];

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Calendar</h1>
          <p className="text-muted-foreground">Manage holidays, exams, events</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" onClick={prevMonth}>←</Button>
          <CardTitle className="text-lg">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
          <Button variant="ghost" onClick={nextMonth}>→</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`min-h-[72px] border rounded-md p-1 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map(e => {
                      const info = getTypeInfo(e.event_type);
                      return (
                        <div key={e.id} className={`text-[10px] px-1 rounded truncate ${info.color}`} title={e.title}>
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Events in {MONTHS[currentDate.getMonth()]}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {currentMonthEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No events this month</p>
          ) : (
            currentMonthEvents.map(e => {
              const info = getTypeInfo(e.event_type);
              return (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={info.color}>{info.label}</Badge>
                    <div>
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(e.start_date), "dd MMM yyyy")}
                        {e.end_date && e.end_date !== e.start_date && ` — ${format(parseISO(e.end_date), "dd MMM yyyy")}`}
                      </p>
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Republic Day Holiday" /></div>
            <div className="space-y-1">
              <Label>Event Type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
