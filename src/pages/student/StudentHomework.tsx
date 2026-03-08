import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function StudentHomework() {
  const { student, homeworkList, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  const upcoming = homeworkList.filter((h: any) => new Date(h.due_date) >= new Date());
  const past = homeworkList.filter((h: any) => new Date(h.due_date) < new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Homework & Assignments</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Pending Homework ({upcoming.length})</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending homework</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((hw: any) => (
                <div key={hw.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{hw.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{hw.subjects?.name} · by {hw.teachers?.name}</p>
                      {hw.description && <p className="text-sm mt-2">{hw.description}</p>}
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(hw.due_date), "dd MMM yyyy")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Past Homework</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.map((hw: any) => (
                <div key={hw.id} className="p-4 rounded-lg border opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{hw.title}</p>
                      <p className="text-sm text-muted-foreground">{hw.subjects?.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                      {format(new Date(hw.due_date), "dd MMM yyyy")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
