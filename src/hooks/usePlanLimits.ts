import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanLimits {
  maxStudents: number | null;
  maxTeachers: number | null;
  currentStudents: number;
  currentTeachers: number;
  loading: boolean;
  planName: string | null;
  canAddStudents: (count?: number) => boolean;
  canAddTeachers: (count?: number) => boolean;
  studentsRemaining: number | null;
  teachersRemaining: number | null;
}

export function usePlanLimits(schoolId: string | null): PlanLimits {
  const [maxStudents, setMaxStudents] = useState<number | null>(null);
  const [maxTeachers, setMaxTeachers] = useState<number | null>(null);
  const [currentStudents, setCurrentStudents] = useState(0);
  const [currentTeachers, setCurrentTeachers] = useState(0);
  const [planName, setPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }

    async function fetch() {
      const [subRes, studCountRes, teachCountRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan_id, is_active")
          .eq("school_id", schoolId!)
          .eq("is_active", true)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId!)
          .eq("status", "active"),
        supabase
          .from("teachers")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId!),
      ]);

      setCurrentStudents(studCountRes.count ?? 0);
      setCurrentTeachers(teachCountRes.count ?? 0);

      if (subRes.data?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("name, max_students, max_teachers")
          .eq("id", subRes.data.plan_id)
          .single();
        if (plan) {
          setMaxStudents(plan.max_students);
          setMaxTeachers(plan.max_teachers);
          setPlanName(plan.name);
        }
      }
      setLoading(false);
    }

    fetch();
  }, [schoolId]);

  const canAddStudents = (count = 1) => {
    if (maxStudents === null) return true;
    return currentStudents + count <= maxStudents;
  };

  const canAddTeachers = (count = 1) => {
    if (maxTeachers === null) return true;
    return currentTeachers + count <= maxTeachers;
  };

  const studentsRemaining = maxStudents !== null ? Math.max(0, maxStudents - currentStudents) : null;
  const teachersRemaining = maxTeachers !== null ? Math.max(0, maxTeachers - currentTeachers) : null;

  return {
    maxStudents, maxTeachers, currentStudents, currentTeachers,
    loading, planName, canAddStudents, canAddTeachers,
    studentsRemaining, teachersRemaining,
  };
}
