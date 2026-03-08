import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Inbox, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SubscriptionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscription_requests" as any)
      .select("*, subscription_plans(name, price)")
      .order("created_at", { ascending: false });
    setRequests((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("subscription_requests" as any)
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id } as any)
      .eq("id", id);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Request ${status}`);
      setSelectedReq(null);
      fetchRequests();
    }
    setUpdating(false);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Requests</h1>
        <p className="text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} pending request(s)` : "Review incoming subscription requests from schools"}
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Inbox className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No subscription requests yet</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className={req.status === "pending" ? "bg-warning/5" : ""}>
                  <TableCell className="font-medium">{req.school_name}</TableCell>
                  <TableCell>{req.contact_name}</TableCell>
                  <TableCell className="text-sm">{req.email}</TableCell>
                  <TableCell>{(req as any).subscription_plans?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "pending" ? "secondary" : req.status === "approved" ? "default" : "destructive"}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(req.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedReq(req)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
          {selectedReq && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">School:</span> <span className="font-medium">{selectedReq.school_name}</span></div>
                <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{selectedReq.contact_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedReq.email}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedReq.phone || "—"}</span></div>
                <div><span className="text-muted-foreground">Plan:</span> <span className="font-medium">{(selectedReq as any).subscription_plans?.name || "Not specified"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedReq.status === "pending" ? "secondary" : selectedReq.status === "approved" ? "default" : "destructive"}>{selectedReq.status}</Badge></div>
              </div>
              {selectedReq.message && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground text-xs mb-1">Message:</p>
                  <p>{selectedReq.message}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedReq?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => updateStatus(selectedReq.id, "rejected")} disabled={updating}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => updateStatus(selectedReq.id, "approved")} disabled={updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
