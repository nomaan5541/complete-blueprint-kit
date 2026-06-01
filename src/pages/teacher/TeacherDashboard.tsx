import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, ClipboardCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { SkeletonDashboard } from "@/components/loaders/PremiumLoader";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      // Get teacher record
      const { data: t } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      setTeacher(t);
      if (!t) { setLoading(false); return; }

      // Get assignments with class/subject names
      const { data: assigns } = await supabase
        .from("teacher_assignments")
        .select("*, classes(name), subjects(name), academic_years(name)")
        .eq("teacher_id", t.id);
      setAssignments(assigns || []);

      // Get today's timetable
      const dayOfWeek = new Date().getDay(); // 0=Sun
      const { data: entries } = await supabase
        .from("timetable_entries")
        .select("*, timetable_slots(name, start_time, end_time, slot_order, is_break), classes(name), subjects(name)")
        .eq("teacher_id", t.id)
        .eq("day_of_week", dayOfWeek)
        .order("timetable_slots(slot_order)");
      setTodaySlots(entries || []);

      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) return <SkeletonDashboard />;
  if (!teacher) return <div className="p-10 text-center text-muted-foreground">No teacher profile found for this account.</div>;

  const uniqueClasses = new Set(assignments.map(a => a.class_id)).size;
  const uniqueSubjects = new Set(assignments.map(a => a.subject_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {teacher.name}</h1>
        <p className="text-muted-foreground">Teacher Dashboard — {format(new Date(), "EEEE, dd MMM yyyy")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Assigned Classes" value={uniqueClasses} icon={GraduationCap} />
        <StatsCard title="Subjects" value={uniqueSubjects} icon={BookOpen} />
        <StatsCard title="Today's Periods" value={todaySlots.length} icon={Clock} />
        <StatsCard title="Total Assignments" value={assignments.length} icon={ClipboardCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Today's Timetable</CardTitle></CardHeader>
          <CardContent>
            {todaySlots.length === 0 ? (
              <p className="text-muted-foreground text-sm">No classes scheduled today</p>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{slot.subjects?.name || "Free Period"}</p>
                      <p className="text-sm text-muted-foreground">{slot.classes?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{slot.timetable_slots?.start_time?.slice(0, 5)} - {slot.timetable_slots?.end_time?.slice(0, 5)}</p>
                      <Badge variant="secondary" className="text-xs">{slot.timetable_slots?.name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Assignments</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assignments yet</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{a.subjects?.name}</p>
                      <p className="text-sm text-muted-foreground">{a.classes?.name}</p>
                    </div>
                    <Badge variant="outline">{a.academic_years?.name}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
