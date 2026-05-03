import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetable() {
  const { student, timetable, slots, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">My Timetable</h1>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">{student.classes?.name} {student.sections?.name ? `- Section ${student.sections.name}` : ""}</CardTitle></CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Timetable not set yet</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Time</TableHead>
                    {DAYS.map((d) => <TableHead key={d}>{d}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id} className={slot.is_break ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium text-xs">{slot.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{slot.start_time?.slice(0, 5)}-{slot.end_time?.slice(0, 5)}</TableCell>
                      {DAYS.map((_, di) => {
                        const entry = timetable.find((e: any) => e.timetable_slots?.slot_order === slot.slot_order && e.day_of_week === di);
                        return (
                          <TableCell key={di} className="text-xs">
                            {slot.is_break ? <span className="text-muted-foreground italic">Break</span> : (
                              entry ? (
                                <div>
                                  <p className="font-medium">{entry.subjects?.name}</p>
                                  {entry.teachers?.name && <p className="text-muted-foreground">{entry.teachers.name}</p>}
                                </div>
                              ) : "—"
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
