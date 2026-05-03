import { useEffect, useState } from "react";
import { useStudentData } from "@/hooks/useStudentData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateIDCardHTML, type TemplateId, type IDCardData } from "@/components/IDCardTemplates";

export default function StudentIDCard() {
  const { student, school, loading } = useStudentData();
  const [template, setTemplate] = useState<TemplateId>("classic-blue");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!school) return;
    // Fetch school's selected template and signature
    async function fetchConfig() {
      const { data } = await supabase
        .from("schools")
        .select("id_card_template, id_card_signature_url")
        .eq("id", (school as any).id)
        .single();
      if (data) {
        if ((data as any).id_card_template) setTemplate((data as any).id_card_template as TemplateId);
        if ((data as any).id_card_signature_url) setSignatureUrl((data as any).id_card_signature_url);
      }
    }
    fetchConfig();
  }, [school]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

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
    signatureUrl: signatureUrl,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Student ID Card</h1>
        <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download / Print</Button>
      </div>
      <div className="flex justify-center">
        <div dangerouslySetInnerHTML={{ __html: generateIDCardHTML(cardData, template) }} />
      </div>
    </div>
  );
}
