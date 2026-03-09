import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, ExternalLink, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default function StudentMeetings() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!schoolId || !user) return;
      setLoading(true);
      const { data } = await supabase
        .from("meetings")
        .select("*, classes(name), subjects(name), sections(name), teachers(name)")
        .eq("school_id", schoolId)
        .in("status", ["live", "scheduled"])
        .order("scheduled_start", { ascending: true });
      setMeetings(data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId, user]);

  const liveMeetings = meetings.filter(m => m.status === "live");
  const scheduledMeetings = meetings.filter(m => m.status === "scheduled");

  const getStatusColor = (status: string) => {
    if (status === "live") return "bg-green-500/15 text-green-700 border-green-300";
    return "bg-blue-500/15 text-blue-700 border-blue-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground text-sm">Join virtual classes and meetings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {/* Live Now */}
          {liveMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" /> Live Now
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liveMeetings.map(m => (
                  <Card key={m.id} className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <Badge className={getStatusColor("live")}>🔴 Live</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {m.teachers?.name || "Teacher"}
                      </p>
                      {m.classes?.name && (
                        <p className="text-xs text-muted-foreground">
                          {m.classes.name}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}
                        </p>
                      )}
                      {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                      <Button size="sm" asChild className="w-full">
                        <a href={m.meet_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-4 w-4" /> Join Class
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {scheduledMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Upcoming</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduledMeetings.map(m => (
                  <Card key={m.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <Badge variant="outline" className={getStatusColor("scheduled")}>Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {m.teachers?.name || "Teacher"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(m.scheduled_start), "MMM d, hh:mm a")}
                      </p>
                      {m.classes?.name && <p className="text-xs text-muted-foreground">{m.classes.name}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No live classes right now</h3>
                <p className="text-sm text-muted-foreground">When your teacher starts a live class, it will appear here for you to join.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
