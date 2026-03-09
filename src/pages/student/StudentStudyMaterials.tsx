import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Video, BookOpen, ClipboardList, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  notes: { label: "Notes", icon: BookOpen, color: "text-blue-500" },
  pdf: { label: "PDF", icon: FileText, color: "text-red-500" },
  video: { label: "Video", icon: Video, color: "text-purple-500" },
  assignment: { label: "Assignment", icon: ClipboardList, color: "text-amber-500" },
};

export default function StudentStudyMaterials() {
  const { student, loading: studentLoading } = useStudentData();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  useEffect(() => {
    if (!student) return;
    async function fetchMaterials() {
      const { data } = await supabase
        .from("study_materials")
        .select("*, subjects(name), classes(name)")
        .eq("class_id", student.class_id)
        .eq("school_id", student.school_id)
        .order("created_at", { ascending: false });
      setMaterials(data || []);
      setLoading(false);
    }
    fetchMaterials();
  }, [student]);

  if (studentLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  const subjects = [...new Set(materials.map(m => m.subjects?.name).filter(Boolean))];

  const filtered = materials.filter(m => {
    if (filterType !== "all" && m.material_type !== filterType) return false;
    if (filterSubject !== "all" && m.subjects?.name !== filterSubject) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Study Materials</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No study materials available</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => {
            const config = TYPE_CONFIG[m.material_type] || TYPE_CONFIG.notes;
            const Icon = config.icon;
            return (
              <Card key={m.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${config.color}`}><Icon className="h-6 w-6" /></div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold leading-tight">{m.title}</CardTitle>
                      {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 mt-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{config.label}</Badge>
                    <Badge variant="secondary" className="text-xs">{m.subjects?.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "dd MMM yyyy")}</span>
                    {m.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-3 w-3" /> Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
