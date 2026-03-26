import { useState, useEffect } from "react";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { ID_CARD_TEMPLATES } from "@/components/id-cards/IDCardTemplates";

export default function BulkIDCards() {
  const { schoolId } = useSchool();
  const { selectedYearId, academicYears } = useAcademicYear();
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any>(null);
  
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("1");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const fetchInitialData = async () => {
      setLoading(true);
      const [clsRes, secRes, schRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
        supabase.from("sections").select("*").eq("school_id", schoolId),
        supabase.from("schools").select("*").eq("id", schoolId).single()
      ]);
      setClasses(clsRes.data || []);
      setSections(secRes.data || []);
      setSchoolData(schRes.data || null);
      setLoading(false);
    };
    fetchInitialData();
  }, [schoolId]);

  const fetchStudents = async () => {
    if (!schoolId || !selectedYearId) return;
    
    setFetching(true);
    let query = supabase
      .from("students")
      .select("*, classes(name), sections(name), academic_years(name), student_master(id, name, father_name, admission_number, gender, date_of_birth, blood_group, mother_name, phone, address, city, state, photo_url)")
      .eq("school_id", schoolId)
      .eq("academic_year_id", selectedYearId)
      .order("name");

    if (selectedClass !== "all") query = query.eq("class_id", selectedClass);
    if (selectedSection !== "all") query = query.eq("section_id", selectedSection);

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch students");
      console.error(error);
    } else {
      // Map master data securely into student object for the template to use
      const mappedStudents = (data || []).map(s => ({
        ...s,
        ...s.student_master, // Merge master fields up
      }));
      setStudents(mappedStudents);
      if (mappedStudents.length === 0) toast.info("No students found for this selection");
    }
    setFetching(false);
  };

  const handlePrint = () => {
    if (students.length === 0) {
      toast.error("Please load students first");
      return;
    }
    window.print();
  };

  const activeYearName = academicYears.find(y => y.id === selectedYearId)?.name || "Current Year";
  const TemplateComponent = ID_CARD_TEMPLATES.find(t => t.id === selectedTemplate)?.component || ID_CARD_TEMPLATES[0].component;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk ID Cards</h1>
          <p className="text-muted-foreground mt-1">Generate and print student ID cards in batches.</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <Button variant="outline" onClick={() => window.print()} disabled={students.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Print All ({students.length})
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.filter(s => selectedClass === "all" || s.class_id === selectedClass).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ID Card Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger>
              <SelectContent>
                {ID_CARD_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchStudents} disabled={fetching} className="w-full">
            {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Load Students
          </Button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="space-y-4 print-area !static !p-0">
          <h3 className="text-lg font-medium text-foreground no-print flex items-center justify-between border-b pb-2">
            Previewing {students.length} Cards
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 align-top justify-items-center print:flex print:flex-wrap print:gap-4 print:justify-start">
            {students.map((student) => (
              <div key={student.id} className="print:break-inside-avoid print:mb-4 shrink-0 transition-transform hover:-translate-y-1 hover:shadow-xl duration-300 no-print-shadow shadow-md rounded-xl overflow-hidden border border-border/50">
                <TemplateComponent 
                  student={student} 
                  school={schoolData} 
                  academicYear={activeYearName} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!fetching && students.length === 0 && (
        <div className="bg-card/50 rounded-xl border border-dashed flex flex-col items-center justify-center py-20 text-muted-foreground no-print">
          <IdCardIcon className="h-10 w-10 mb-4 opacity-20" />
          <p>Select a class and click "Load Students" to generate ID cards.</p>
        </div>
      )}
    </div>
  );
}

function IdCardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 10h2" />
      <path d="M16 14h2" />
      <path d="M6.17 15a3 3 0 0 1 5.66 0" />
      <circle cx="9" cy="11" r="2" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
    </svg>
  );
}
