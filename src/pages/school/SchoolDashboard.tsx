import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { StatsCard } from "@/components/StatsCard";
import { GraduationCap, Users, Calendar, Layers } from "lucide-react";

export default function SchoolDashboard() {
  const { schoolId } = useSchool();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, academicYears: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [studentsRes, teachersRes, classesRes, yearsRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("academic_years").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
      ]);
      setStats({
        students: studentsRes.count ?? 0,
        teachers: teachersRes.count ?? 0,
        classes: classesRes.count ?? 0,
        academicYears: yearsRes.count ?? 0,
      });
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Students" value={loading ? "..." : stats.students} icon={GraduationCap} />
        <StatsCard title="Total Teachers" value={loading ? "..." : stats.teachers} icon={Users} />
        <StatsCard title="Classes" value={loading ? "..." : stats.classes} icon={Layers} />
        <StatsCard title="Academic Years" value={loading ? "..." : stats.academicYears} icon={Calendar} />
      </div>
    </div>
  );
}
