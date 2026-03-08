import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Layers } from "lucide-react";

interface ClassItem { id: string; name: string; display_order: number; sections: { id: string; name: string }[] }

export default function ClassesAndSections() {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classOpen, setClassOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchClasses = async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, display_order")
      .eq("school_id", schoolId)
      .order("display_order");
    const { data: sectionData } = await supabase
      .from("sections")
      .select("id, name, class_id")
      .eq("school_id", schoolId);

    const merged = (classData || []).map((c: any) => ({
      ...c,
      sections: (sectionData || []).filter((s: any) => s.class_id === c.id),
    }));
    setClasses(merged);
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, [schoolId]);

  const handleAddClass = async () => {
    if (!className.trim()) { toast.error("Class name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("classes").insert({
      school_id: schoolId!,
      name: className.trim(),
      display_order: classes.length,
    });
    if (error) toast.error(error.message);
    else { toast.success("Class added"); setClassOpen(false); setClassName(""); fetchClasses(); }
    setSaving(false);
  };

  const handleAddSection = async () => {
    if (!sectionName.trim() || !selectedClassId) { toast.error("Select class and enter section name"); return; }
    setSaving(true);
    const { error } = await supabase.from("sections").insert({
      class_id: selectedClassId,
      school_id: schoolId!,
      name: sectionName.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Section added"); setSectionOpen(false); setSectionName(""); setSelectedClassId(""); fetchClasses(); }
    setSaving(false);
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Class deleted"); fetchClasses(); }
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Section deleted"); fetchClasses(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes & Sections</h1>
          <p className="text-muted-foreground">Manage class structure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSectionOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
          <Button onClick={() => setClassOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Layers className="h-16 w-16 mb-4 opacity-30" />
            <p>No classes yet. Add your first class to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteClass(cls.id)} className="text-destructive hover:text-destructive h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cls.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sections</p>
                  ) : (
                    cls.sections.map((sec) => (
                      <Badge key={sec.id} variant="secondary" className="gap-1">
                        {sec.name}
                        <button onClick={() => deleteSection(sec.id)} className="ml-1 text-destructive hover:text-destructive/80">×</button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Class Name</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Class 1" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassOpen(false)}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Section Name</Label><Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="e.g. A" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
