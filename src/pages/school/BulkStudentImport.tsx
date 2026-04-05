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
import { Upload, Download, Loader2, AlertTriangle, CheckCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  className: string;
  section: string;
  admission_date: string;
  caste_category: string;
  error?: string;
}

// Map UDISE+ class names to our class names
const UDISE_CLASS_MAP: Record<string, string> = {
  "LKG/KG1/Pre-School": "LKG",
  "UKG/KG2/Pre-Primary": "UKG",
  "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5",
  "VI": "6", "VII": "7", "VIII": "8", "IX": "9", "X": "10",
};

export default function BulkStudentImport() {
  const { schoolId } = useSchool();
  const { canAddStudents, currentStudents, maxStudents, studentsRemaining, planName } = usePlanLimits(schoolId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);
  const [isUdiseFormat, setIsUdiseFormat] = useState(false);

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

  const parseUDISEExcel = (workbook: XLSX.WorkBook): ParsedRow[] => {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

    // Find the header row (contains "Class", "Section", "DOB", "Name", etc.)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.some((cell: any) => String(cell).trim() === "Class") &&
          row.some((cell: any) => String(cell).trim() === "Name")) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) return [];

    const headers = jsonData[headerRowIdx].map((h: any) => String(h).trim());
    const colIdx = (name: string) => headers.indexOf(name);

    // Skip the "(1)(2)(3)..." numbering row if present
    let dataStartIdx = headerRowIdx + 1;
    if (jsonData[dataStartIdx] && String(jsonData[dataStartIdx][0]).match(/^\(\d+\)$/)) {
      dataStartIdx++;
    }

    const results: ParsedRow[] = [];
    for (let i = dataStartIdx; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[colIdx("Name")]) continue;

      const rawClass = String(row[colIdx("Class")] || "").trim();
      const name = String(row[colIdx("Name")] || "").trim();
      if (!name) continue;

      const admNo = String(row[colIdx("Admission No.")] || "").trim();
      const gender = String(row[colIdx("Gender")] || "").trim();
      const dob = String(row[colIdx("DOB")] || "").trim();
      const section = String(row[colIdx("Section")] || "A").trim();
      const motherName = String(row[colIdx("Mother Name")] || "").trim();
      const fatherName = String(row[colIdx("Father Name")] || "").trim();
      const address = String(row[colIdx("Address")] || "").trim();
      const pincode = String(row[colIdx("Pincode")] || "").trim();
      const phone = String(row[colIdx("Mobile No.")] || "").trim();
      const admDate = String(row[colIdx("Admission Date")] || "").trim();
      const casteCategory = String(row[colIdx("Social Category")] || "").trim();

      const parsed: ParsedRow = {
        admission_number: admNo || `AUTO-${i}`,
        name,
        gender: gender.toLowerCase(),
        date_of_birth: dob,
        father_name: fatherName === "NA" ? "" : fatherName,
        father_phone: phone === "NA" ? "" : phone,
        mother_name: motherName === "NA" ? "" : motherName,
        address: address === "NA" ? "" : address,
        city: "",
        state: "",
        pincode: pincode === "NA" ? "" : pincode,
        className: rawClass,
        section,
        admission_date: admDate,
        caste_category: casteCategory,
      };

      if (!parsed.admission_number || parsed.admission_number.startsWith("AUTO-")) {
        parsed.error = "Missing admission number";
      } else if (!parsed.name) {
        parsed.error = "Missing name";
      }

      results.push(parsed);
    }
    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const parsed = parseUDISEExcel(workbook);
          setRows(parsed);
          setIsUdiseFormat(true);
          setResult(null);
          if (parsed.length > 0) {
            toast.success(`Parsed ${parsed.length} students from UDISE+ Excel`);
          } else {
            toast.error("No student data found in the file");
          }
        } catch (err) {
          toast.error("Failed to parse Excel file");
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = parseCSV(ev.target?.result as string);
        setRows(parsed);
        setIsUdiseFormat(false);
        setResult(null);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!selectedYear) { toast.error("Select academic year"); return; }
    const validRows = rows.filter(r => !r.error);
    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }
    if (validRows.length > 2000) { toast.error("Maximum 2000 students per import. Please split your file."); return; }
    if (!canAddStudents(validRows.length)) {
      toast.error(`Plan limit exceeded! Your ${planName || "plan"} allows ${maxStudents} students (${currentStudents} currently). You're trying to add ${validRows.length} but only ${studentsRemaining} slots remaining. Please upgrade your plan.`);
      return;
    }

    setImporting(true);

    if (isUdiseFormat) {
      // Use edge function for UDISE bulk import (class info is per-row)
      try {
        const students = validRows.map(r => ({
          admissionNumber: r.admission_number,
          name: r.name,
          gender: r.gender,
          dob: r.date_of_birth,
          fatherName: r.father_name,
          motherName: r.mother_name,
          phone: r.father_phone,
          address: r.address,
          pincode: r.pincode,
          className: r.className,
          section: r.section,
          admissionDate: r.admission_date,
          casteCategory: r.caste_category,
        }));

        const { data, error } = await supabase.functions.invoke("bulk-import-students", {
          body: { schoolId, academicYearId: selectedYear, students },
        });

        if (error) throw error;
        setResult({ success: data.success, failed: data.failed, errors: data.errors });
        toast.success(`Imported ${data.success} students${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
      } catch (err: any) {
        toast.error(err.message || "Import failed");
      }
    } else {
      // Original CSV import logic (requires class selection)
      if (!selectedClass) { toast.error("Select class"); setImporting(false); return; }
      let success = 0, failed = 0;
      for (const row of validRows) {
        try {
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
        } catch { failed++; }
      }
      setResult({ success, failed });
      toast.success(`Imported ${success} students${failed > 0 ? `, ${failed} failed` : ""}`);
    }
    setImporting(false);
  };

  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => r.error).length;
  const filteredSections = sections.filter(s => s.class_id === selectedClass);

  // Get unique classes from parsed UDISE data
  const udiseClasses = isUdiseFormat
    ? [...new Set(rows.filter(r => !r.error).map(r => r.className))]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Student Import</h1>
        <p className="text-muted-foreground">Import up to 2,000 students from CSV or UDISE+ Excel file</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Step 1: Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Choose CSV or Excel File
            </Button>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> CSV Template
            </Button>
          </div>
          {isUdiseFormat && rows.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">UDISE+ format detected</span>
              <span className="text-sm text-muted-foreground">
                — Classes: {udiseClasses.map(c => UDISE_CLASS_MAP[c] || c).join(", ")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Step 2: Select Academic Year {!isUdiseFormat && "& Class"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Academic Year *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!isUdiseFormat && (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Step 3: Preview & Import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" /> {validCount} valid</Badge>
              {errorCount > 0 && <Badge variant="outline" className="bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> {errorCount} errors</Badge>}
            </div>
            <div className="rounded-lg border bg-card max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {isUdiseFormat && <TableHead>Class</TableHead>}
                    <TableHead>Adm No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                      <TableCell>{i + 1}</TableCell>
                      {isUdiseFormat && <TableCell className="text-xs">{UDISE_CLASS_MAP[r.className] || r.className}</TableCell>}
                      <TableCell className="font-mono text-xs">{r.admission_number}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.gender}</TableCell>
                      <TableCell>{r.father_name}</TableCell>
                      <TableCell>{r.father_phone}</TableCell>
                      <TableCell>{r.error ? <span className="text-destructive text-xs">{r.error}</span> : <CheckCircle className="h-3.5 w-3.5 text-success" />}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length > 100 && (
                    <TableRow>
                      <TableCell colSpan={isUdiseFormat ? 8 : 7} className="text-center text-muted-foreground text-sm">
                        ... and {rows.length - 100} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {result && (
              <div className="p-4 rounded-lg border bg-success/5 space-y-2">
                <p className="font-medium text-success">Import Complete: {result.success} added, {result.failed} failed</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1">
                    {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
                  </div>
                )}
              </div>
            )}

            {!result && (
              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={importing || validCount === 0} size="lg">
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import {validCount} Students
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
