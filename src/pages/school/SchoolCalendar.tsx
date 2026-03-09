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
import { Plus, Loader2, Trash2, Edit2, CalendarDays, PartyPopper, BookOpen, Users, Megaphone, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { logAudit } from "@/lib/auditLog";

const EVENT_TYPES = [
  { value: "holiday", label: "Holiday", color: "bg-destructive/10 text-destructive border-destructive/20", icon: PartyPopper },
  { value: "exam", label: "Exam", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: BookOpen },
  { value: "ptm", label: "PTM", color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", icon: Users },
  { value: "sports", label: "Sports", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: Sparkles },
  { value: "annual", label: "Annual Day", color: "bg-primary/10 text-primary border-primary/20", icon: CalendarDays },
  { value: "meeting", label: "Meeting", color: "bg-secondary text-secondary-foreground border-secondary", icon: Users },
  { value: "general", label: "General", color: "bg-muted text-muted-foreground border-muted-foreground/20", icon: Megaphone },
];

// Telangana State Government Holidays for current academic year
const TELANGANA_HOLIDAYS = [
  { title: "Republic Day", start_date: "2026-01-26", event_type: "holiday" },
  { title: "Maha Shivaratri", start_date: "2026-02-15", event_type: "holiday" },
  { title: "Ugadi (Telugu New Year)", start_date: "2026-03-19", event_type: "holiday" },
  { title: "Ramadan (Eid-ul-Fitr)", start_date: "2026-03-31", event_type: "holiday" },
  { title: "Sri Rama Navami", start_date: "2026-04-06", event_type: "holiday" },
  { title: "Dr. B.R. Ambedkar Jayanti", start_date: "2026-04-14", event_type: "holiday" },
  { title: "May Day", start_date: "2026-05-01", event_type: "holiday" },
  { title: "Buddha Purnima", start_date: "2026-05-12", event_type: "holiday" },
  { title: "Bakrid (Eid-ul-Adha)", start_date: "2026-06-07", event_type: "holiday" },
  { title: "Bonalu Festival", start_date: "2026-07-13", event_type: "holiday" },
  { title: "Muharram", start_date: "2026-07-06", event_type: "holiday" },
  { title: "Independence Day", start_date: "2026-08-15", event_type: "holiday" },
  { title: "Sri Krishna Janmashtami", start_date: "2026-08-15", event_type: "holiday" },
  { title: "Milad-un-Nabi", start_date: "2026-09-05", event_type: "holiday" },
  { title: "Bathukamma Festival", start_date: "2026-10-03", event_type: "holiday" },
  { title: "Dussehra (Vijayadashami)", start_date: "2026-10-12", event_type: "holiday" },
  { title: "Milad-un-Nabi (Prophet's Birthday)", start_date: "2026-10-18", event_type: "holiday" },
  { title: "Deepavali (Diwali)", start_date: "2026-10-31", event_type: "holiday" },
  { title: "Telangana Formation Day", start_date: "2026-06-02", event_type: "holiday" },
  { title: "Gandhi Jayanti", start_date: "2026-10-02", event_type: "holiday" },
  { title: "Christmas", start_date: "2025-12-25", event_type: "holiday" },
  { title: "Sankranti", start_date: "2026-01-14", event_type: "holiday" },
  { title: "Kanuma", start_date: "2026-01-15", event_type: "holiday" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const emptyForm = { title: "", description: "", event_type: "general", start_date: "", end_date: "" };

export default function SchoolCalendar() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchEvents = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("school_events")
      .select("*").eq("school_id", schoolId).order("start_date");
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [schoolId]);

  const openCreate = (date?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, start_date: date || "" });
    setOpen(true);
  };

  const openEdit = (event: any) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_date: event.start_date,
      end_date: event.end_date || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_date) { toast.error("Title and start date required"); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("school_events").update({
        title: form.title.trim(),
        description: form.description || null,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
      }).eq("id", editingId);
      if (error) toast.error(error.message);
      else {
        toast.success("Event updated");
        logAudit(schoolId!, "update", "school_event", editingId, { title: form.title });
      }
    } else {
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
      else {
        toast.success("Event added");
        logAudit(schoolId!, "create", "school_event", undefined, { title: form.title });
      }
    }
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchEvents();
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("school_events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      logAudit(schoolId!, "delete", "school_event", id, { title });
      fetchEvents();
    }
  };

  const seedTelanganaHolidays = async () => {
    if (!confirm("This will add Telangana state holidays to your calendar. Continue?")) return;
    setSeeding(true);
    const rows = TELANGANA_HOLIDAYS.map(h => ({
      school_id: schoolId!,
      title: h.title,
      event_type: h.event_type,
      start_date: h.start_date,
      created_by: user?.id,
    }));
    const { error } = await supabase.from("school_events").insert(rows);
    if (error) toast.error(error.message);
    else {
      toast.success(`${TELANGANA_HOLIDAYS.length} Telangana holidays added!`);
      logAudit(schoolId!, "seed_holidays", "school_event", undefined, { count: TELANGANA_HOLIDAYS.length });
      fetchEvents();
    }
    setSeeding(false);
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
  const getTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[6];

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  if (loading) return <div className="p-10 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">School Calendar</h1>
          <p className="text-sm text-muted-foreground">Manage holidays, exams, PTMs & events</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={seedTelanganaHolidays} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PartyPopper className="mr-2 h-4 w-4" />}
            Add Telangana Holidays
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(t => (
          <Badge key={t.value} variant="outline" className={`text-[11px] ${t.color} border`}>
            <t.icon className="h-3 w-3 mr-1" />{t.label}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base font-semibold">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2 uppercase tracking-wider">{d}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[72px] border rounded-lg p-1 cursor-pointer transition-all duration-150 hover:shadow-sm ${
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/5" :
                    isToday ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map(e => {
                      const info = getTypeInfo(e.event_type);
                      return (
                        <div key={e.id} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${info.color}`} title={e.title}>
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && <span className="text-[9px] text-muted-foreground font-medium">+{dayEvents.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Detail */}
      {selectedDay && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{format(selectedDay, "EEEE, dd MMMM yyyy")}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => openCreate(format(selectedDay, "yyyy-MM-dd"))}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No events on this day</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map(e => {
                  const info = getTypeInfo(e.event_type);
                  return (
                    <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${info.color} border`}>{info.label}</Badge>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{e.title}</p>
                          {e.description && <p className="text-[11px] text-muted-foreground truncate">{e.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id, e.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Events List */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">All Events — {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {currentMonthEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No events this month</p>
          ) : (
            currentMonthEvents.map(e => {
              const info = getTypeInfo(e.event_type);
              return (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className={`text-[10px] shrink-0 border ${info.color}`}>{info.label}</Badge>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(e.start_date), "dd MMM yyyy")}
                        {e.end_date && e.end_date !== e.start_date && ` — ${format(parseISO(e.end_date), "dd MMM yyyy")}`}
                      </p>
                      {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id, e.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sankranti Holiday" />
            </div>
            <div className="space-y-1.5">
              <Label>Event Type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Update" : "Add"} Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
