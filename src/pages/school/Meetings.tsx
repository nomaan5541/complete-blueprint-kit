import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Video, ExternalLink, Clock, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled" | "verified" | "rejected";

export default function Meetings() {
  const { schoolId } = useSchool();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; meeting: any; action: "verified" | "rejected" }>({
    open: false, meeting: null, action: "verified"
  });
  const [verifyNotes, setVerifyNotes] = useState("");

  const fetchMeetings = async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data } = await supabase
      .from("meetings")
      .select("*, classes(name), subjects(name), teachers(name), academic_years(name)")
      .eq("school_id", schoolId)
      .order("scheduled_start", { ascending: false });
    setMeetings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, [schoolId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { className: string; label: string }> = {
      live: { className: "bg-green-500/15 text-green-700 border-green-300", label: "🔴 Live" },
      scheduled: { className: "bg-blue-500/15 text-blue-700 border-blue-300", label: "Scheduled" },
      ended: { className: "bg-muted text-muted-foreground", label: "Ended" },
      cancelled: { className: "bg-destructive/15 text-destructive", label: "Cancelled" },
      verified: { className: "bg-emerald-500/15 text-emerald-700 border-emerald-300", label: "✅ Verified" },
      rejected: { className: "bg-orange-500/15 text-orange-700 border-orange-300", label: "❌ Rejected" },
    };
    const s = styles[status] || { className: "", label: status };
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
  };

  const handleVerifyAction = async () => {
    if (!verifyDialog.meeting) return;
    const { error } = await supabase
      .from("meetings")
      .update({
        status: verifyDialog.action as any,
        description: verifyDialog.meeting.description
          ? `${verifyDialog.meeting.description}\n\n[${verifyDialog.action.toUpperCase()}] ${verifyNotes}`
          : `[${verifyDialog.action.toUpperCase()}] ${verifyNotes}`,
      })
      .eq("id", verifyDialog.meeting.id);

    if (error) {
      toast.error(`Failed to ${verifyDialog.action} meeting: ${error.message}`);
    } else {
      toast.success(`Meeting ${verifyDialog.action} successfully`);
      setVerifyDialog({ open: false, meeting: null, action: "verified" });
      setVerifyNotes("");
      fetchMeetings();
    }
  };

  const liveCount = meetings.filter(m => m.status === "live").length;
  const endedUnverified = meetings.filter(m => m.status === "ended").length;

  const filtered = meetings.filter(m => statusFilter === "all" || m.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground text-sm">
            Monitor and verify virtual meetings across your school
            {liveCount > 0 && <Badge className="ml-2 bg-green-500/15 text-green-700">{liveCount} Live</Badge>}
            {endedUnverified > 0 && (
              <Badge className="ml-2 bg-amber-500/15 text-amber-700">{endedUnverified} Awaiting Verification</Badge>
            )}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meetings</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live Now</SelectItem>
            <SelectItem value="ended">Ended (Unverified)</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No meetings found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Teachers can start live classes from their portal."
                : `No ${statusFilter} meetings.`}
            </p>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
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
                    <div className="flex justify-end gap-1">
                      {m.status === "live" && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={m.meet_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {m.status === "ended" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setVerifyDialog({ open: true, meeting: m, action: "verified" })}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" /> Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setVerifyDialog({ open: true, meeting: m, action: "rejected" })}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {(m.status === "verified" || m.status === "rejected") && (
                        <span className="text-xs text-muted-foreground italic">
                          {m.status === "verified" ? "Reviewed ✓" : "Reviewed ✗"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Verify/Reject Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={open => {
        if (!open) setVerifyDialog({ open: false, meeting: null, action: "verified" });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyDialog.action === "verified" ? "✅ Verify Meeting" : "❌ Reject Meeting"}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog.meeting?.title} — by {verifyDialog.meeting?.teachers?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder={verifyDialog.action === "verified"
                  ? "Meeting conducted as scheduled..."
                  : "Reason for rejection..."}
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog({ open: false, meeting: null, action: "verified" })}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyAction}
              variant={verifyDialog.action === "verified" ? "default" : "destructive"}
            >
              {verifyDialog.action === "verified" ? "Verify" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
