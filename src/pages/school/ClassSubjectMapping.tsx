import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function ClassSubjectMapping() {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [cRes, sRes, mRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("subjects").select("*").eq("school_id", schoolId!).order("name"),
        supabase.from("class_subjects").select("*").eq("school_id", schoolId!),
      ]);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);
      setMappings(mRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass) return;
    const classMappings = mappings.filter(m => m.class_id === selectedClass);
    setCheckedSubjects(new Set(classMappings.map(m => m.subject_id)));
  }, [selectedClass, mappings]);

  const toggleSubject = (subjectId: string) => {
    setCheckedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);

    // Delete existing mappings for this class
    await supabase.from("class_subjects").delete().eq("class_id", selectedClass).eq("school_id", schoolId!);

    // Insert new mappings
    if (checkedSubjects.size > 0) {
      const records = Array.from(checkedSubjects).map(subjectId => ({
        school_id: schoolId!,
        class_id: selectedClass,
        subject_id: subjectId,
      }));
      const { error } = await supabase.from("class_subjects").insert(records);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    // Refresh mappings
    const { data } = await supabase.from("class_subjects").select("*").eq("school_id", schoolId!);
    setMappings(data || []);
    toast.success("Subject mapping saved");
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  // Summary: show all classes with their subjects
  const classSummary = classes.map(cls => ({
    ...cls,
    subjects: subjects.filter(s => mappings.some(m => m.class_id === cls.id && m.subject_id === s.id)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subject Mapping</h1>
        <p className="text-muted-foreground">Assign subjects to each class</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Map Subjects to Class</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map(s => (
                  <div key={s.id} className="flex items-center space-x-2 rounded-lg border p-3">
                    <Checkbox
                      id={`sub-${s.id}`}
                      checked={checkedSubjects.has(s.id)}
                      onCheckedChange={() => toggleSubject(s.id)}
                    />
                    <label htmlFor={`sub-${s.id}`} className="text-sm font-medium cursor-pointer flex-1">
                      {s.name}
                      {s.code && <span className="text-muted-foreground ml-1">({s.code})</span>}
                    </label>
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Mapping
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary view */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classSummary.map(cls => (
          <Card key={cls.id}>
            <CardHeader className="pb-2"><CardTitle className="text-lg">{cls.name}</CardTitle></CardHeader>
            <CardContent>
              {cls.subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects mapped</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {cls.subjects.map((s: any) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
