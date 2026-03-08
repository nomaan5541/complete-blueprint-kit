import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: t } = await supabase.from("teachers").select("id").eq("user_id", user!.id).maybeSingle();
      if (!t) { setLoading(false); return; }

      const { data } = await supabase
        .from("timetable_entries")
        .select("*, timetable_slots(name, start_time, end_time, slot_order, is_break), classes(name), subjects(name)")
        .eq("teacher_id", t.id)
        .order("day_of_week")
        .order("timetable_slots(slot_order)");
      setEntries(data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  // Group by day
  const byDay: Record<number, any[]> = {};
  entries.forEach(e => {
    if (!byDay[e.day_of_week]) byDay[e.day_of_week] = [];
    byDay[e.day_of_week].push(e);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground">Your weekly teaching schedule</p>
      </div>

      {Object.keys(byDay).length === 0 ? (
        <p className="text-muted-foreground">No timetable entries assigned to you yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].filter(d => byDay[d]).map(day => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {DAYS[day]}
                  {day === new Date().getDay() && <Badge className="bg-primary text-primary-foreground">Today</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {byDay[day]
                    .sort((a: any, b: any) => (a.timetable_slots?.slot_order || 0) - (b.timetable_slots?.slot_order || 0))
                    .map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between rounded border p-2.5 text-sm">
                        <div>
                          <p className="font-medium">{entry.subjects?.name || "Free"}</p>
                          <p className="text-xs text-muted-foreground">{entry.classes?.name}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{entry.timetable_slots?.start_time?.slice(0, 5)} - {entry.timetable_slots?.end_time?.slice(0, 5)}</p>
                          <p>{entry.timetable_slots?.name}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
