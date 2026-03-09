import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "none" | "trial" | "starter" | "professional" | "ultimate";

// Features available per plan tier - comprehensive mapping
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
    "/school/notifications",
    "/school/reports",
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
    "/school/students/profile",
    "/school/promotion",
    "/school/archive",
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
    "/school/meetings",
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
    "/school/students/profile",
    "/school/promotion",
    "/school/archive",
    "/school/teachers",
    "/school/attendance",
    "/school/face-attendance",
    "/school/exams",
    "/school/report-card",
    "/school/ai-report-card",
    "/school/fees",
    "/school/fees/dues",
    "/school/timetable",
    "/school/notifications",
    "/school/reports",
    "/school/documents",
    "/school/calendar",
    "/school/meetings",
    "/school/audit-logs",
    "/school/backup-restore",
    "/school/settings",
    "/school/setup",
  ],
};

// Human-readable feature labels for display on landing page
export const PLAN_FEATURE_LABELS: { label: string; starter: boolean; professional: boolean; ultimate: boolean }[] = [
  { label: "Academic Year Management", starter: true, professional: true, ultimate: true },
  { label: "Classes & Sections", starter: true, professional: true, ultimate: true },
  { label: "Subject Management", starter: true, professional: true, ultimate: true },
  { label: "Student Management", starter: true, professional: true, ultimate: true },
  { label: "Manual Attendance", starter: true, professional: true, ultimate: true },
  { label: "Fee Management & Dues", starter: true, professional: true, ultimate: true },
  { label: "Notifications", starter: true, professional: true, ultimate: true },
  { label: "Basic Reports", starter: true, professional: true, ultimate: true },
  { label: "School Settings", starter: true, professional: true, ultimate: true },
  { label: "Bulk Student Import", starter: false, professional: true, ultimate: true },
  { label: "Student Transfer/Leaving", starter: false, professional: true, ultimate: true },
  { label: "Student Promotion", starter: false, professional: true, ultimate: true },
  { label: "Student Archive", starter: false, professional: true, ultimate: true },
  { label: "Teacher Management", starter: false, professional: true, ultimate: true },
  { label: "Exams & Results", starter: false, professional: true, ultimate: true },
  { label: "Report Card Generation", starter: false, professional: true, ultimate: true },
  { label: "Timetable", starter: false, professional: true, ultimate: true },
  { label: "Document Management", starter: false, professional: true, ultimate: true },
  { label: "School Calendar", starter: false, professional: true, ultimate: true },
  { label: "Online Meetings", starter: false, professional: true, ultimate: true },
  { label: "AI Face Attendance", starter: false, professional: false, ultimate: true },
  { label: "AI Report Card", starter: false, professional: false, ultimate: true },
  { label: "Audit Logs", starter: false, professional: false, ultimate: true },
  { label: "Backup & Restore", starter: false, professional: false, ultimate: true },
  { label: "Advanced Analytics", starter: false, professional: false, ultimate: true },
  { label: "Priority Support", starter: false, professional: false, ultimate: true },
];

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
