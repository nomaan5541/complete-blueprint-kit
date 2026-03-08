import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function StudentStudyMaterials() {
  const { student, loading: studentLoading } = useStudentData();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    async function fetchDocs() {
      const { data } = await supabase.from("student_documents")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });
      setDocuments(data || []);
      setLoading(false);
    }
    fetchDocs();
  }, [student]);

  if (studentLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Study Materials & Documents</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Documents</CardTitle></CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No documents available</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary/60" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1 h-4 w-4" /> Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
