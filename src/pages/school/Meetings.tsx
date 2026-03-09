import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Video, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Meetings() {
  const { schoolId } = useSchool();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!schoolId) return;
      setLoading(true);
      const { data } = await supabase
        .from("meetings")
        .select("*, classes(name), subjects(name), teachers(name), academic_years(name)")
        .eq("school_id", schoolId)
        .order("scheduled_start", { ascending: false });
      setMeetings(data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      live: "bg-green-500/15 text-green-700 border-green-300",
      scheduled: "bg-blue-500/15 text-blue-700 border-blue-300",
      ended: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/15 text-destructive",
    };
    return <Badge variant="outline" className={styles[status] || ""}>{status === "live" ? "🔴 Live" : status}</Badge>;
  };

  const liveCount = meetings.filter(m => m.status === "live").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meetings</h1>
        <p className="text-muted-foreground text-sm">
          Monitor all virtual meetings across your school
          {liveCount > 0 && <Badge className="ml-2 bg-green-500/15 text-green-700">{liveCount} Live</Badge>}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No meetings yet</h3>
            <p className="text-sm text-muted-foreground">Teachers can start live classes from their portal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Teacher</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Scheduled</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map(m => (
                <TableRow key={m.id} className={m.status === "live" ? "bg-green-50/50 dark:bg-green-950/10" : ""}>
                  <TableCell>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{m.teachers?.name}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{m.teachers?.name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {m.classes?.name || "All"}{m.subjects?.name ? ` • ${m.subjects.name}` : ""}
                  </TableCell>
                  <TableCell>{getStatusBadge(m.status)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {format(new Date(m.scheduled_start), "MMM d, hh:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.status === "live" && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={m.meet_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
