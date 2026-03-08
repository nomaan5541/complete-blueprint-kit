import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Clock } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable() {
  const { schoolId } = useSchool();
  const [slots, setSlots] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [slotOpen, setSlotOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: "", start_time: "", end_time: "", is_break: false });
  const [entryForm, setEntryForm] = useState({ slot_id: "", day_of_week: "0", subject_id: "", teacher_id: "" });

  const fetchAll = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [slotsRes, cRes, secRes, subRes, tRes, yRes] = await Promise.all([
      supabase.from("timetable_slots").select("*").eq("school_id", schoolId).order("slot_order"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
      supabase.from("subjects").select("*").eq("school_id", schoolId).order("name"),
      supabase.from("teachers").select("*").eq("school_id", schoolId).eq("status", "active").order("name"),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).eq("status", "active"),
    ]);
    setSlots(slotsRes.data || []);
    setClasses(cRes.data || []);
    setSections(secRes.data || []);
    setSubjects(subRes.data || []);
    setTeachers(tRes.data || []);
    setAcademicYears(yRes.data || []);
    if (yRes.data && yRes.data.length > 0) setSelectedYear(yRes.data[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const loadEntries = async () => {
    if (!selectedClass || !selectedYear || !schoolId) return;
    let query = supabase.from("timetable_entries").select("*, subjects(name), teachers(name)")
      .eq("school_id", schoolId).eq("class_id", selectedClass).eq("academic_year_id", selectedYear);
    if (selectedSection) query = query.eq("section_id", selectedSection);
    const { data } = await query;
    setEntries(data || []);
  };

  useEffect(() => { if (selectedClass && selectedYear) loadEntries(); }, [selectedClass, selectedSection, selectedYear]);

  const handleAddSlot = async () => {
    if (!slotForm.name || !slotForm.start_time || !slotForm.end_time) { toast.error("All fields required"); return; }
    setSaving(true);
    const { error } = await supabase.from("timetable_slots").insert({
      school_id: schoolId!,
      name: slotForm.name,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      slot_order: slots.length,
      is_break: slotForm.is_break,
    });
    if (error) toast.error(error.message);
    else { toast.success("Slot added"); setSlotOpen(false); setSlotForm({ name: "", start_time: "", end_time: "", is_break: false }); fetchAll(); }
    setSaving(false);
  };

  const handleAddEntry = async () => {
    if (!entryForm.slot_id || !selectedClass || !selectedYear) { toast.error("Select class and fill all fields"); return; }
    setSaving(true);
    const { error } = await supabase.from("timetable_entries").insert({
      school_id: schoolId!,
      academic_year_id: selectedYear,
      class_id: selectedClass,
      section_id: selectedSection || null,
      slot_id: entryForm.slot_id,
      day_of_week: parseInt(entryForm.day_of_week),
      subject_id: entryForm.subject_id || null,
      teacher_id: entryForm.teacher_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Entry added"); setEntryOpen(false); setEntryForm({ slot_id: "", day_of_week: "0", subject_id: "", teacher_id: "" }); loadEntries(); }
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("timetable_entries").delete().eq("id", id);
    toast.success("Removed");
    loadEntries();
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from("timetable_slots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Slot deleted"); fetchAll(); }
  };

  const filteredSections = sections.filter((s) => s.class_id === selectedClass);

  // Build timetable grid: rows = slots, cols = days
  const getEntry = (slotId: string, day: number) => entries.find((e) => e.slot_id === slotId && e.day_of_week === day);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">Manage class timetables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSlotOpen(true)}><Clock className="mr-2 h-4 w-4" /> Manage Slots</Button>
          <Button onClick={() => setEntryOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(""); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedClass && slots.length > 0 && (
        <div className="rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Period</TableHead>
                <TableHead className="w-24">Time</TableHead>
                {DAYS.map((d) => <TableHead key={d}>{d}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id} className={slot.is_break ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    {slot.name}
                    {slot.is_break && <Badge variant="secondary" className="ml-2 text-xs">Break</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</TableCell>
                  {DAYS.map((_, dayIdx) => {
                    const entry = getEntry(slot.id, dayIdx);
                    return (
                      <TableCell key={dayIdx} className="min-w-[100px]">
                        {slot.is_break ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : entry ? (
                          <div className="flex items-center gap-1">
                            <div>
                              <p className="text-xs font-medium">{entry.subjects?.name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{entry.teachers?.name || ""}</p>
                            </div>
                            <button onClick={() => deleteEntry(entry.id)} className="text-destructive hover:text-destructive/80 ml-auto">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Period Slots */}
      {slots.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Period Slots</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <Badge key={s.id} variant={s.is_break ? "secondary" : "outline"} className="gap-1 py-1">
                  {s.name} ({s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)})
                  <button onClick={() => deleteSlot(s.id)} className="ml-1 text-destructive">×</button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={slotOpen} onOpenChange={setSlotOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Period Slot</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={slotForm.name} onChange={(e) => setSlotForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Period 1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Time</Label><Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm(p => ({ ...p, start_time: e.target.value }))} /></div>
              <div className="space-y-1"><Label>End Time</Label><Input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm(p => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2">
              <Checkbox checked={slotForm.is_break} onCheckedChange={(v) => setSlotForm(p => ({ ...p, is_break: !!v }))} />
              <span className="text-sm">This is a break (lunch, recess)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSlot} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Day</Label>
              <Select value={entryForm.day_of_week} onValueChange={(v) => setEntryForm(p => ({ ...p, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Period</Label>
              <Select value={entryForm.slot_id} onValueChange={(v) => setEntryForm(p => ({ ...p, slot_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{slots.filter(s => !s.is_break).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Select value={entryForm.subject_id} onValueChange={(v) => setEntryForm(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Teacher</Label>
              <Select value={entryForm.teacher_id} onValueChange={(v) => setEntryForm(p => ({ ...p, teacher_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEntry} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
