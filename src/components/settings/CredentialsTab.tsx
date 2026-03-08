import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  schoolId: string;
}

export default function CredentialsTab({ schoolId }: Props) {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "teacher" | "student">("all");

  const fetchCredentials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_credentials" as any)
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load credentials"); }
    setCredentials((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCredentials(); }, [schoolId]);

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("school_credentials" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Credential removed"); fetchCredentials(); }
  };

  const filtered = credentials.filter((c: any) => {
    if (filter !== "all" && c.account_type !== filter) return false;
    if (search && !c.person_name?.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const teacherCount = credentials.filter((c: any) => c.account_type === "teacher").length;
  const studentCount = credentials.filter((c: any) => c.account_type === "student").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Login Credentials</CardTitle>
        <CardDescription>
          View login credentials for teacher and student accounts created through the admin panel.
          Total: {credentials.length} ({teacherCount} teachers, {studentCount} students)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
            <Button variant={filter === "teacher" ? "default" : "outline"} size="sm" onClick={() => setFilter("teacher")}>Teachers</Button>
            <Button variant={filter === "student" ? "default" : "outline"} size="sm" onClick={() => setFilter("student")}>Students</Button>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No saved credentials found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.person_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.account_type === "teacher" ? "bg-primary/10 text-primary" : "bg-accent/50"}>
                        {c.account_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {visiblePasswords[c.id] ? c.password_plain : "••••••••"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePassword(c.id)}>
                          {visiblePasswords[c.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
