import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Printer, Loader2, Users, CreditCard, Settings2, Pen, Eye } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { TEMPLATES, generateIDCardHTML, type TemplateId, type IDCardData } from "@/components/IDCardTemplates";

interface StudentData {
  id: string;
  name: string;
  admission_number: string;
  date_of_birth: string | null;
  blood_group: string | null;
  father_name: string | null;
  father_phone: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  pen_number: string | null;
  classes: { name: string } | null;
  sections: { name: string } | null;
  academic_years: { name: string } | null;
}

export default function BulkIDCardGenerator() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [template, setTemplate] = useState<TemplateId>("classic-blue");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId || !selectedYearId) return;
    Promise.all([
      supabase.from("students").select("id, name, admission_number, date_of_birth, blood_group, father_name, father_phone, phone, address, photo_url, pen_number, classes(name), sections(name), academic_years(name)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).eq("status", "active").order("name"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("schools").select("*").eq("id", schoolId).single(),
    ]).then(([sRes, cRes, schRes]) => {
      setStudents((sRes.data as any) || []);
      setClasses(cRes.data || []);
      const sch = schRes.data as any;
      setSchool(sch);
      if (sch?.id_card_template) setTemplate(sch.id_card_template as TemplateId);
      if (sch?.id_card_signature_url) setSignatureUrl(sch.id_card_signature_url);
      setLoading(false);
    });
  }, [schoolId, selectedYearId]);

  const filtered = students.filter((s) => classFilter === "all" || (s.classes as any)?.name === classFilter);

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const saveTemplateToSchool = async (t: TemplateId) => {
    setTemplate(t);
    if (!schoolId) return;
    await supabase.from("schools").update({ id_card_template: t } as any).eq("id", schoolId);
  };

  const handleSignatureSave = async (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    setShowSignatureDialog(false);
    if (!schoolId) return;
    setSaving(true);
    await supabase.from("schools").update({ id_card_signature_url: dataUrl } as any).eq("id", schoolId);
    setSaving(false);
    toast.success("Signature saved and will appear on all ID cards");
  };

  const buildCardData = (s: StudentData): IDCardData => ({
    studentName: s.name,
    fatherName: s.father_name || "",
    admissionNumber: s.admission_number,
    className: s.classes?.name || "—",
    sectionName: s.sections?.name || "",
    dateOfBirth: s.date_of_birth || "",
    bloodGroup: s.blood_group || "",
    phone: s.phone || s.father_phone || "",
    address: s.address || "",
    photoUrl: s.photo_url,
    schoolName: school?.name || "SCHOOL",
    schoolAddress: [school?.address, school?.city, school?.state].filter(Boolean).join(", "),
    schoolPhone: school?.phone || "",
    schoolLogoUrl: school?.logo_url || null,
    signatureUrl: signatureUrl,
    academicYear: s.academic_years?.name || "",
    penNumber: s.pen_number || "",
  });

  const handleGenerate = () => {
    const sel = students.filter((s) => selected.has(s.id));
    if (sel.length === 0) { toast.error("Select at least one student"); return; }
    setGenerating(true);

    const cards = sel.map((s) => generateIDCardHTML(buildCardData(s), template)).join("");

    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow pop-ups"); setGenerating(false); return; }

    w.document.write(`<html><head><title>ID Cards - ${school?.name}</title>
      <style>body{margin:20px;font-family:system-ui,sans-serif;background:#f5f5f5;}.grid{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;}@media print{body{background:white;margin:0;}.grid{gap:8px;}.no-print{display:none!important;}}</style></head><body>
      <div class="no-print" style="text-align:center;margin-bottom:20px;"><h2>Student ID Cards (${sel.length})</h2><button onclick="window.print()" style="padding:8px 24px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;">🖨️ Print All</button></div>
      <div class="grid">${cards}</div></body></html>`);
    w.document.close();
    setGenerating(false);
    toast.success(`Generated ${sel.length} ID cards`);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><CreditCard className="h-7 w-7" /> Bulk ID Card Generator</h1>
          <p className="text-muted-foreground">Select template, add signature, and generate printable ID cards</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><Pen className="mr-2 h-4 w-4" /> {signatureUrl ? "Update" : "Add"} Signature</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Draw Principal's Signature</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Use your mouse or pen to sign below. This will appear on all generated ID cards.</p>
              <SignaturePad onSave={handleSignatureSave} initialValue={signatureUrl} />
            </DialogContent>
          </Dialog>
          <Button onClick={handleGenerate} disabled={generating || selected.size === 0}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Generate {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" /> Choose Template (applies to entire school)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => saveTemplateToSchool(t.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  template === t.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-transparent hover:border-muted-foreground/20"
                }`}
              >
                <div className="w-full h-16 rounded-md" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}>
                  <div className="flex items-center justify-center h-full text-white text-xs font-bold opacity-80">ID</div>
                </div>
                <span className="text-xs font-medium text-center">{t.name}</span>
                <span className="text-[10px] text-muted-foreground text-center">{t.description}</span>
              </button>
            ))}
          </div>
          {signatureUrl && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current Signature:</span>
              <img src={signatureUrl} alt="Signature" className="h-10 border rounded" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {previewStudent && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <div dangerouslySetInnerHTML={{ __html: generateIDCardHTML(buildCardData(previewStudent), template) }} />
          </CardContent>
        </Card>
      )}

      {/* Filters & Selection */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Label className="text-xs mb-1 block">Filter by Class</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
          <span className="text-sm text-muted-foreground">Select All ({filtered.length})</span>
        </div>
        <Badge variant="secondary" className="mt-5"><Users className="h-3 w-3 mr-1" /> {selected.size} selected</Badge>
      </div>

      {/* Student List */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selected.has(s.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
            <div onClick={() => toggleOne(s.id)} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" alt="" /> : s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.admission_number} · {s.classes?.name || "—"}{s.sections?.name ? ` ${s.sections.name}` : ""}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewStudent(s)} title="Preview">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No students found for the selected filter.</div>
      )}
    </div>
  );
}
