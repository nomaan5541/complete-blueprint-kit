import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SchoolRow {
  id: string;
  name: string;
  city: string | null;
  status: string;
  admin_id: string | null;
  created_at: string;
  logo_url: string | null;
  adminName?: string;
  studentCount?: number;
  planName?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-warning/10 text-warning border-warning/20",
};

export default function Schools() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSchools = async () => {
    setLoading(true);
    let query = supabase.from("schools").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) { toast.error(error.message); setLoading(false); return; }

    const schoolList = (data || []) as SchoolRow[];

    // Fetch admin names, student counts, and plans in parallel
    const adminIds = schoolList.map(s => s.admin_id).filter(Boolean) as string[];
    const schoolIds = schoolList.map(s => s.id);

    const [profilesRes, studentsRes, subsRes] = await Promise.all([
      adminIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", adminIds)
        : Promise.resolve({ data: [] }),
      schoolIds.length > 0
        ? supabase.from("students").select("school_id").in("school_id", schoolIds).eq("status", "active")
        : Promise.resolve({ data: [] }),
      schoolIds.length > 0
        ? supabase.from("subscriptions").select("school_id, subscription_plans(name)").in("school_id", schoolIds).eq("is_active", true)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

    const studentCounts: Record<string, number> = {};
    (studentsRes.data || []).forEach((s: any) => { studentCounts[s.school_id] = (studentCounts[s.school_id] || 0) + 1; });

    const planMap: Record<string, string> = {};
    (subsRes.data || []).forEach((s: any) => { if (s.subscription_plans) planMap[s.school_id] = s.subscription_plans.name; });

    const enriched = schoolList.map(s => ({
      ...s,
      adminName: s.admin_id ? profileMap[s.admin_id] || "—" : "—",
      studentCount: studentCounts[s.id] || 0,
      planName: planMap[s.id] || "No Plan",
    }));

    setSchools(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchSchools(); }, [statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("schools").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("School deleted"); fetchSchools(); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schools</h1>
          <p className="text-muted-foreground">Manage all registered schools</p>
        </div>
        <Button onClick={() => navigate("/admin/schools/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add School
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search schools..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : schools.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No schools found</TableCell></TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {school.logo_url ? (
                        <img src={school.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {school.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-xs text-muted-foreground">{school.city || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{school.adminName}</TableCell>
                  <TableCell className="text-sm">{school.studentCount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{school.planName}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[school.status] || ""}>{school.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/schools/${school.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/schools/${school.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(school.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the school and all associated data. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
