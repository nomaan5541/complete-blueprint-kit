import { useEffect, useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { generateIDCardHTML, type TemplateId, type IDCardData } from "@/components/IDCardTemplates";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentIDCard() {
  const { student, school, loading } = useStudentData();
  const [template, setTemplate] = useState<TemplateId>("classic-blue");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!school) return;
    (async () => {
      const { data } = await supabase
        .from("schools")
        .select("id_card_template, id_card_signature_url")
        .eq("id", (school as any).id)
        .single();
      if (data) {
        if ((data as any).id_card_template) setTemplate((data as any).id_card_template as TemplateId);
        if ((data as any).id_card_signature_url) setSignatureUrl((data as any).id_card_signature_url);
      }
    })();
  }, [school]);

  if (loading) return <div className="pt-4 h-72 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const cardData: IDCardData = {
    studentName: student.name,
    fatherName: student.father_name || "",
    admissionNumber: student.admission_number,
    className: student.classes?.name || "—",
    sectionName: student.sections?.name || "",
    dateOfBirth: student.date_of_birth || "",
    bloodGroup: student.blood_group || "",
    phone: student.phone || "",
    address: student.address || "",
    photoUrl: student.photo_url,
    schoolName: school?.name || "SCHOOL",
    schoolAddress: [school?.address, school?.city, school?.state].filter(Boolean).join(", "),
    schoolPhone: school?.phone || "",
    schoolLogoUrl: school?.logo_url || null,
    signatureUrl,
    academicYear: student.academic_years?.name || "",
    penNumber: (student as any).pen_number || "",
  };

  const handleDownload = () => {
    const html = generateIDCardHTML(cardData, template);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>ID Card - ${student.name}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;font-family:system-ui,sans-serif;}@media print{body{background:white;}}</style></head><body>
      ${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-4 flex flex-col items-center gap-4">
        <div className="bg-white rounded-2xl p-4 overflow-auto max-w-full" dangerouslySetInnerHTML={{ __html: generateIDCardHTML(cardData, template) }} />
        <button
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[linear-gradient(135deg,hsl(var(--student-primary)),hsl(var(--student-blue)))] font-extrabold text-sm text-[hsl(var(--student-foreground))] shadow-[0_12px_30px_hsl(var(--student-primary)/0.4)] active:scale-[0.99] transition"
        >
          <Download className="h-4 w-4" /> Download / Print ID Card
        </button>
      </StudentPanel>
    </div>
  );
}
