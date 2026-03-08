import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StudentResults() {
  const { student, marks, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  // Group marks by exam
  const examGroups: Record<string, any[]> = {};
  marks.forEach((m) => {
    const examName = m.exams?.name || "Unknown";
    if (!examGroups[examName]) examGroups[examName] = [];
    examGroups[examName].push(m);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exam Results</h1>

      {marks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No exam results yet</CardContent></Card>
      ) : (
        Object.entries(examGroups).map(([examName, examMarks]) => {
          const totalObtained = examMarks.reduce((s, m) => s + Number(m.marks_obtained || 0), 0);
          const totalMax = examMarks.reduce((s, m) => s + Number(m.max_marks || 0), 0);
          const pct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0";

          return (
            <Card key={examName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{examName}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">Total: {totalObtained}/{totalMax}</Badge>
                    <Badge variant={Number(pct) >= 50 ? "default" : "destructive"}>{pct}%</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examMarks.map((m) => {
                      const p = m.max_marks > 0 ? ((m.marks_obtained / m.max_marks) * 100).toFixed(0) : "0";
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.subjects?.name || "—"}</TableCell>
                          <TableCell className="text-right">{m.marks_obtained ?? "—"}</TableCell>
                          <TableCell className="text-right">{m.max_marks}</TableCell>
                          <TableCell className="text-right">{p}%</TableCell>
                          <TableCell>{m.grade || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
