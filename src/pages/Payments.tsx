import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let query = supabase
        .from("payment_history")
        .select("*, schools(name)")
        .order("payment_date", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data } = await query;
      let result = data || [];
      if (search) {
        result = result.filter((p: any) =>
          p.schools?.name?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setPayments(result);
      setLoading(false);
    }
    fetch();
  }, [statusFilter, search]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-success/10 text-success",
      pending: "bg-warning/10 text-warning",
      failed: "bg-destructive/10 text-destructive",
      refunded: "bg-muted text-muted-foreground",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View all subscription payment records</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by school..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No payments found</TableCell></TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.schools?.name || "—"}</TableCell>
                  <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{p.payment_method || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusBadge(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.notes || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
