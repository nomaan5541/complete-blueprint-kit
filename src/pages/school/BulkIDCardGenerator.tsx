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
import { toast } from "sonner";
import { Printer, Loader2, Users, CreditCard } from "lucide-react";

interface StudentData {
  id: string;
  name: string;
  admission_number: string;
  date_of_birth: string | null;
  blood_group: string | null;
  father_name: string | null;
  father_phone: string | null;
  photo_url: string | null;
  gender: string | null;
  classes: { name: string } | null;
  sections: { name: string } | null;
  academic_years: { name: string } | null;
}

type TemplateId = "classic" | "modern" | "minimal" | "vibrant" | "corporate" | "gradient" | "bordered" | "elegant" | "playful" | "dark";

const TEMPLATES: { id: TemplateId; name: string; preview: string }[] = [
  { id: "classic", name: "Classic Blue", preview: "bg-blue-600" },
  { id: "modern", name: "Modern Teal", preview: "bg-teal-600" },
  { id: "minimal", name: "Minimal Gray", preview: "bg-gray-700" },
  { id: "vibrant", name: "Vibrant Purple", preview: "bg-purple-600" },
  { id: "corporate", name: "Corporate Navy", preview: "bg-indigo-900" },
  { id: "gradient", name: "Gradient Sunset", preview: "bg-gradient-to-r from-orange-500 to-pink-500" },
  { id: "bordered", name: "Bordered Red", preview: "bg-red-600" },
  { id: "elegant", name: "Elegant Gold", preview: "bg-amber-700" },
  { id: "playful", name: "Playful Green", preview: "bg-emerald-500" },
  { id: "dark", name: "Dark Mode", preview: "bg-gray-900" },
];

function getTemplateStyles(t: TemplateId): { header: string; headerText: string; body: string; footer: string; accent: string; border: string } {
  const map: Record<TemplateId, any> = {
    classic: { header: "background:linear-gradient(135deg,#1e40af,#3b82f6)", headerText: "#fff", body: "#fff", footer: "#eff6ff", accent: "#1e40af", border: "#3b82f6" },
    modern: { header: "background:linear-gradient(135deg,#0d9488,#14b8a6)", headerText: "#fff", body: "#fff", footer: "#f0fdfa", accent: "#0d9488", border: "#14b8a6" },
    minimal: { header: "background:#374151", headerText: "#fff", body: "#fff", footer: "#f3f4f6", accent: "#374151", border: "#d1d5db" },
    vibrant: { header: "background:linear-gradient(135deg,#7c3aed,#a855f7)", headerText: "#fff", body: "#faf5ff", footer: "#f3e8ff", accent: "#7c3aed", border: "#a855f7" },
    corporate: { header: "background:linear-gradient(135deg,#1e1b4b,#312e81)", headerText: "#fff", body: "#fff", footer: "#eef2ff", accent: "#312e81", border: "#4338ca" },
    gradient: { header: "background:linear-gradient(135deg,#f97316,#ec4899)", headerText: "#fff", body: "#fff", footer: "#fef3c7", accent: "#f97316", border: "#ec4899" },
    bordered: { header: "background:#dc2626", headerText: "#fff", body: "#fff", footer: "#fef2f2", accent: "#dc2626", border: "#dc2626" },
    elegant: { header: "background:linear-gradient(135deg,#92400e,#d97706)", headerText: "#fff", body: "#fffbeb", footer: "#fef3c7", accent: "#92400e", border: "#d97706" },
    playful: { header: "background:linear-gradient(135deg,#059669,#10b981)", headerText: "#fff", body: "#ecfdf5", footer: "#d1fae5", accent: "#059669", border: "#10b981" },
    dark: { header: "background:linear-gradient(135deg,#111827,#1f2937)", headerText: "#f9fafb", body: "#1f2937", footer: "#111827", accent: "#6366f1", border: "#374151" },
  };
  return map[t];
}

function generateCardHTML(s: StudentData, schoolName: string, schoolCity: string, logoUrl: string | null, template: TemplateId): string {
  const st = getTemplateStyles(template);
  const textColor = template === "dark" ? "#e5e7eb" : "#333";
  const labelColor = template === "dark" ? "#9ca3af" : "#888";
  const cls = s.classes?.name || "—";
  const sec = s.sections?.name ? ` - ${s.sections.name}` : "";

  return `
    <div style="width:340px;border:2px solid ${st.border};border-radius:12px;overflow:hidden;background:${st.body};page-break-inside:avoid;margin:8px;">
      <div style="${st.header};color:${st.headerText};padding:14px;text-align:center;">
        ${logoUrl ? `<img src="${logoUrl}" style="height:28px;width:28px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;margin-right:6px;" />` : ""}
        <span style="font-size:15px;font-weight:700;letter-spacing:1px;vertical-align:middle;">${schoolName}</span>
        <div style="font-size:10px;opacity:0.85;margin-top:2px;">${schoolCity || "Student Identity Card"}</div>
      </div>
      <div style="padding:16px;display:flex;gap:14px;">
        <div style="width:75px;height:95px;border-radius:8px;border:2px solid ${st.border};background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
          ${s.photo_url ? `<img src="${s.photo_url}" style="width:100%;height:100%;object-fit:cover;" />` : `<span style="font-size:28px;color:#999;">${s.name?.charAt(0)}</span>`}
        </div>
        <div style="flex:1;">
          <div style="margin-bottom:5px;"><div style="font-size:9px;color:${labelColor};text-transform:uppercase;letter-spacing:0.5px;">Name</div><div style="font-size:12px;font-weight:600;color:${textColor};">${s.name}</div></div>
          <div style="margin-bottom:5px;"><div style="font-size:9px;color:${labelColor};text-transform:uppercase;">Adm No</div><div style="font-size:12px;font-weight:600;color:${textColor};">${s.admission_number}</div></div>
          <div style="margin-bottom:5px;"><div style="font-size:9px;color:${labelColor};text-transform:uppercase;">Class</div><div style="font-size:12px;font-weight:600;color:${textColor};">${cls}${sec}</div></div>
          <div style="margin-bottom:5px;"><div style="font-size:9px;color:${labelColor};text-transform:uppercase;">DOB</div><div style="font-size:12px;font-weight:600;color:${textColor};">${s.date_of_birth || "—"}</div></div>
          <div><div style="font-size:9px;color:${labelColor};text-transform:uppercase;">Father</div><div style="font-size:12px;font-weight:600;color:${textColor};">${s.father_name || "—"}</div></div>
        </div>
      </div>
      <div style="background:${st.footer};padding:8px 16px;border-top:1px solid ${st.border};text-align:center;font-size:9px;color:${labelColor};">
        ${s.blood_group ? `Blood: ${s.blood_group} · ` : ""}${s.academic_years?.name || ""} · ${s.father_phone || ""}
      </div>
    </div>`;
}

export default function BulkIDCardGenerator() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!schoolId || !selectedYearId) return;
    Promise.all([
      supabase.from("students").select("id, name, admission_number, date_of_birth, blood_group, father_name, father_phone, photo_url, gender, classes(name), sections(name), academic_years(name)").eq("school_id", schoolId).eq("academic_year_id", selectedYearId).eq("status", "active").order("name"),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("schools").select("*").eq("id", schoolId).single(),
    ]).then(([sRes, cRes, schRes]) => {
      setStudents((sRes.data as any) || []);
      setClasses(cRes.data || []);
      setSchool(schRes.data);
      setLoading(false);
    });
  }, [schoolId, selectedYearId]);

  const filtered = students.filter((s) => classFilter === "all" || (s.classes as any)?.name === classFilter);

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleGenerate = () => {
    const selectedStudents = students.filter((s) => selected.has(s.id));
    if (selectedStudents.length === 0) {
      toast.error("Select at least one student");
      return;
    }
    setGenerating(true);

    const schoolName = school?.name || "EDUPRIMEX";
    const schoolCity = [school?.city, school?.state].filter(Boolean).join(", ");
    const logoUrl = school?.logo_url || null;

    const cards = selectedStudents.map((s) => generateCardHTML(s, schoolName, schoolCity, logoUrl, template)).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to generate ID cards");
      setGenerating(false);
      return;
    }

    printWindow.document.write(`
      <html><head><title>ID Cards - ${schoolName}</title>
      <style>
        body { margin: 20px; font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
        .grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
        @media print {
          body { background: white; margin: 0; }
          .grid { gap: 8px; }
          .no-print { display: none !important; }
        }
      </style></head><body>
      <div class="no-print" style="text-align:center;margin-bottom:20px;">
        <h2 style="margin:0 0 8px;">Student ID Cards (${selectedStudents.length})</h2>
        <button onclick="window.print()" style="padding:8px 24px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print All</button>
      </div>
      <div class="grid">${cards}</div>
      </body></html>
    `);
    printWindow.document.close();
    setGenerating(false);
    toast.success(`Generated ${selectedStudents.length} ID cards`);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><CreditCard className="h-7 w-7" /> Bulk ID Card Generator</h1>
          <p className="text-muted-foreground">Select students and a template to generate printable ID cards</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating || selected.size === 0}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
          Generate {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Choose Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                  template === t.id ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/20"
                }`}
              >
                <div className={`w-10 h-14 rounded-md ${t.preview}`} />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{t.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
        <Badge variant="secondary" className="mt-5">
          <Users className="h-3 w-3 mr-1" /> {selected.size} selected
        </Badge>
      </div>

      {/* Student List */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => toggleOne(s.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              selected.has(s.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <Checkbox checked={selected.has(s.id)} />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
              {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" alt="" /> : s.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.admission_number} · {s.classes?.name || "—"}{s.sections?.name ? ` ${s.sections.name}` : ""}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No students found for the selected filter.</div>
      )}
    </div>
  );
}
