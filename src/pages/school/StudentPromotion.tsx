import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export default function StudentPromotion() {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const [fromYear, setFromYear] = useState("");
  const [fromClass, setFromClass] = useState("");
  const [toYear, setToYear] = useState("");
  const [toClass, setToClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [cRes, yRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("academic_years").select("*").eq("school_id", schoolId!).order("start_date", { ascending: false }),
      ]);
      setClasses(cRes.data || []);
      setAcademicYears(yRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const loadStudents = async () => {
    if (!fromYear || !fromClass) { toast.error("Select source year and class"); return; }
    const { data } = await supabase.from("students").select("id, name, admission_number, sections(name)")
      .eq("school_id", schoolId!).eq("academic_year_id", fromYear).eq("class_id", fromClass).eq("status", "active").order("name");
    setStudents(data || []);
    setSelectedStudents(new Set((data || []).map((s: any) => s.id)));
    setStudentsLoaded(true);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map((s) => s.id)));
  };

  const handlePromote = async () => {
    if (!toYear || !toClass) { toast.error("Select destination year and class"); return; }
    if (selectedStudents.size === 0) { toast.error("Select at least one student"); return; }
    setPromoting(true);

    // Mark old records as promoted
    const ids = Array.from(selectedStudents);
    const { error: updateError } = await supabase.from("students").update({ status: "promoted" }).in("id", ids);
    if (updateError) { toast.error(updateError.message); setPromoting(false); return; }

    // Create new records in new year/class
    const studentsToPromote = students.filter((s) => selectedStudents.has(s.id));
    const newRecords = studentsToPromote.map((s) => ({
      school_id: schoolId!,
      academic_year_id: toYear,
      admission_number: s.admission_number,
      name: s.name,
      class_id: toClass,
      status: "active" as const,
    }));

    // Insert one by one to handle unique constraint gracefully
    let successCount = 0;
    for (const record of newRecords) {
      const { error } = await supabase.from("students").insert(record);
      if (!error) successCount++;
    }

    toast.success(`${successCount} students promoted`);
    setPromoting(false);
    setStudentsLoaded(false);
    setStudents([]);
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  const fromYearName = academicYears.find((y) => y.id === fromYear)?.name || "";
  const toYearName = academicYears.find((y) => y.id === toYear)?.name || "";
  const fromClassName = classes.find((c) => c.id === fromClass)?.name || "";
  const toClassName = classes.find((c) => c.id === toClass)?.name || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Promotion</h1>
        <p className="text-muted-foreground">Promote students to the next class/year</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">FROM</h3>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={fromYear} onValueChange={setFromYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={fromClass} onValueChange={setFromClass}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">TO</h3>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={toYear} onValueChange={setToYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={toClass} onValueChange={setToClass}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={loadStudents}>Load Students</Button>
          </div>
        </CardContent>
      </Card>

      {studentsLoaded && (
        <>
          {fromYearName && toYearName && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{fromClassName} ({fromYearName})</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>{toClassName} ({toYearName})</span>
              <span className="text-muted-foreground ml-2">· {selectedStudents.size} selected</span>
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedStudents.size === students.length && students.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Adm No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No students found</TableCell></TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox checked={selectedStudents.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{(s.sections as any)?.name || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {students.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handlePromote} disabled={promoting || selectedStudents.size === 0} size="lg">
                {promoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Promote {selectedStudents.size} Students
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
