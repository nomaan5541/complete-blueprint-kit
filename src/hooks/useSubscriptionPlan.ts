import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "none" | "starter" | "professional" | "ultimate";

// Features available per plan tier
const PLAN_FEATURES: Record<PlanTier, string[]> = {
  none: [],
  starter: [
    "/school",
    "/school/academic-years",
    "/school/classes",
    "/school/subjects",
    "/school/subject-mapping",
    "/school/students",
    "/school/attendance",
    "/school/fees",
    "/school/fees/dues",
    "/school/reports",
    "/school/notifications",
    "/school/settings",
  ],
  professional: [
    "/school",
    "/school/academic-years",
    "/school/classes",
    "/school/subjects",
    "/school/subject-mapping",
    "/school/students",
    "/school/students/import",
    "/school/students/transfer",
    "/school/promotion",
    "/school/teachers",
    "/school/attendance",
    "/school/exams",
    "/school/report-card",
    "/school/fees",
    "/school/fees/dues",
    "/school/timetable",
    "/school/notifications",
    "/school/reports",
    "/school/documents",
    "/school/calendar",
    "/school/settings",
  ],
  ultimate: [
    "/school",
    "/school/academic-years",
    "/school/classes",
    "/school/subjects",
    "/school/subject-mapping",
    "/school/students",
    "/school/students/import",
    "/school/students/transfer",
    "/school/promotion",
    "/school/teachers",
    "/school/attendance",
    "/school/exams",
    "/school/report-card",
    "/school/fees",
    "/school/fees/dues",
    "/school/timetable",
    "/school/notifications",
    "/school/reports",
    "/school/documents",
    "/school/calendar",
    "/school/audit-logs",
    "/school/settings",
  ],
};

// Map plan names to tiers
function getPlanTier(planName: string | null): PlanTier {
  if (!planName) return "none";
  const lower = planName.toLowerCase();
  if (lower.includes("ultimate")) return "ultimate";
  if (lower.includes("professional") || lower.includes("pro")) return "professional";
  if (lower.includes("starter") || lower.includes("basic")) return "starter";
  return "starter";
}

export function useSubscriptionPlan(schoolId: string | null) {
  const [planTier, setPlanTier] = useState<PlanTier>("none");
  const [planName, setPlanName] = useState<string | null>(null);
  const [maxStudents, setMaxStudents] = useState<number | null>(null);
  const [maxTeachers, setMaxTeachers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }

    async function fetchPlan() {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id, is_active, end_date")
        .eq("school_id", schoolId!)
        .eq("is_active", true)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) {
        setPlanTier("none");
        setLoading(false);
        return;
      }

      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("name, max_students, max_teachers")
        .eq("id", sub.plan_id)
        .single();

      if (plan) {
        const tier = getPlanTier(plan.name);
        setPlanTier(tier);
        setPlanName(plan.name);
        setMaxStudents(plan.max_students);
        setMaxTeachers(plan.max_teachers);
      }
      setLoading(false);
    }

    fetchPlan();
  }, [schoolId]);

  const isFeatureAvailable = (url: string): boolean => {
    if (planTier === "ultimate") return true;
    return PLAN_FEATURES[planTier]?.includes(url) ?? false;
  };

  const getRequiredPlan = (url: string): string => {
    if (PLAN_FEATURES.starter.includes(url)) return "Starter";
    if (PLAN_FEATURES.professional.includes(url)) return "Professional";
    return "Ultimate";
  };

  return { planTier, planName, maxStudents, maxTeachers, loading, isFeatureAvailable, getRequiredPlan };
}
