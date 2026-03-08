import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Shield } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogs() {
  const { schoolId } = useSchool();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    if (!schoolId) return;
    supabase.from("audit_logs")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, [schoolId]);

  const entities = [...new Set(logs.map(l => l.entity_type))];

  const filtered = logs.filter(l => {
    if (entityFilter !== "all" && l.entity_type !== entityFilter) return false;
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.entity_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const actionColor: Record<string, string> = {
    create: "bg-success/10 text-success",
    update: "bg-primary/10 text-primary",
    delete: "bg-destructive/10 text-destructive",
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6 text-center">
          <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Total Logs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold text-success">{logs.filter(l => l.action.includes("create")).length}</p>
          <p className="text-xs text-muted-foreground">Creates</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold text-destructive">{logs.filter(l => l.action.includes("delete")).length}</p>
          <p className="text-xs text-muted-foreground">Deletes</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No audit logs yet</TableCell></TableRow>
            ) : (
              filtered.map(l => {
                const actionType = l.action.includes("create") ? "create" : l.action.includes("delete") ? "delete" : "update";
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "dd MMM yyyy, hh:mm a")}</TableCell>
                    <TableCell><Badge variant="outline" className={actionColor[actionType] || ""}>{l.action}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{l.entity_type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details).slice(0, 80) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
