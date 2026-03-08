import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Download, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface ParsedRow {
  admission_number: string;
  name: string;
  gender: string;
  date_of_birth: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  error?: string;
}

export default function BulkStudentImport() {
  const { schoolId } = useSchool();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
      supabase.from("academic_years").select("*").eq("school_id", schoolId).eq("status", "active"),
    ]).then(([c, s, y]) => {
      setClasses(c.data || []);
      setSections(s.data || []);
      setAcademicYears(y.data || []);
      if (y.data?.[0]) setSelectedYear(y.data[0].id);
    });
  }, [schoolId]);

  const downloadTemplate = () => {
    const headers = "admission_number,name,gender,date_of_birth,father_name,father_phone,mother_name,address,city,state,pincode";
    const sample = "ADM-2025-001,Rahul Kumar,male,2015-06-15,Ravi Kumar,9876543210,Priya Kumar,123 Main St,Hyderabad,Telangana,500001";
    const blob = new Blob([headers + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "student_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = line.split(",").map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      if (!row.admission_number) row.error = "Missing admission number";
      else if (!row.name) row.error = "Missing name";
      return row as ParsedRow;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target?.result as string);
      setRows(parsed);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedClass || !selectedYear) { toast.error("Select class and academic year"); return; }
    const validRows = rows.filter(r => !r.error);
    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }

    setImporting(true);
    let success = 0, failed = 0;

    for (const row of validRows) {
      try {
        // Create or find master record
        const { data: existing } = await supabase.from("student_master" as any)
          .select("id").eq("school_id", schoolId!).eq("admission_number", row.admission_number).maybeSingle();

        let masterId: string;
        if (existing) {
          masterId = (existing as any).id;
        } else {
          const { data: newMaster, error: mErr } = await supabase.from("student_master" as any).insert({
            school_id: schoolId!, admission_number: row.admission_number, name: row.name,
            gender: row.gender || null, date_of_birth: row.date_of_birth || null,
            father_name: row.father_name || null, father_phone: row.father_phone || null,
            mother_name: row.mother_name || null, address: row.address || null,
            city: row.city || null, state: row.state || null, pincode: row.pincode || null,
          } as any).select("id").single();
          if (mErr) { failed++; continue; }
          masterId = (newMaster as any).id;
        }

        // Create year record
        const { error } = await supabase.from("students").insert({
          school_id: schoolId!, admission_number: row.admission_number, name: row.name,
          gender: row.gender || null, date_of_birth: row.date_of_birth || null,
          father_name: row.father_name || null, father_phone: row.father_phone || null,
          mother_name: row.mother_name || null, address: row.address || null,
          city: row.city || null, state: row.state || null, pincode: row.pincode || null,
          class_id: selectedClass, section_id: selectedSection || null,
          academic_year_id: selectedYear, student_master_id: masterId,
        });
        if (error) failed++; else success++;
      } catch {
        failed++;
      }
    }

    setResult({ success, failed });
    toast.success(`Imported ${success} students${failed > 0 ? `, ${failed} failed` : ""}`);
    setImporting(false);
  };

  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => r.error).length;
  const filteredSections = sections.filter(s => s.class_id === selectedClass);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Student Import</h1>
        <p className="text-muted-foreground">Import students from CSV file</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Step 1: Download Template & Prepare Data</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" /> Download CSV Template</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Step 2: Select Class & Academic Year</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Academic Year *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(""); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Step 3: Upload CSV File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Choose CSV File</Button>

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" /> {validCount} valid</Badge>
                {errorCount > 0 && <Badge variant="outline" className="bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> {errorCount} errors</Badge>}
              </div>
              <div className="rounded-lg border bg-card max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Adm No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Father</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{r.admission_number}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.gender}</TableCell>
                        <TableCell>{r.father_name}</TableCell>
                        <TableCell>{r.father_phone}</TableCell>
                        <TableCell>{r.error ? <span className="text-destructive text-xs">{r.error}</span> : <CheckCircle className="h-3.5 w-3.5 text-success" />}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg border bg-success/5">
              <p className="font-medium text-success">Import Complete: {result.success} added, {result.failed} failed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && !result && (
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={importing || validCount === 0} size="lg">
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {validCount} Students
          </Button>
        </div>
      )}
    </div>
  );
}
