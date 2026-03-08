import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useSchool() {
  const { user, role } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const [setupCompleted, setSetupCompleted] = useState<boolean>(true);
  const [schoolStatus, setSchoolStatus] = useState<string>("active");
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) { setLoading(false); return; }
      if (role === "school_admin") {
        const { data } = await supabase
          .from("schools")
          .select("id, name, setup_completed, status")
          .eq("admin_id", user.id)
          .maybeSingle();
        const sid = data?.id ?? null;
        setSchoolId(sid);
        setSchoolName(data?.name ?? "");
        setSetupCompleted((data as any)?.setup_completed ?? false);
        setSchoolStatus(data?.status ?? "active");

        // Check subscription expiry
        if (sid) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("end_date, is_active")
            .eq("school_id", sid)
            .eq("is_active", true)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sub) {
            setSubscriptionEndDate(sub.end_date);
            const isExpired = new Date(sub.end_date) < new Date();
            setSubscriptionExpired(isExpired);

            // Auto-update school status to expired if subscription expired
            if (isExpired && data?.status === "active") {
              await supabase.from("schools").update({ status: "expired" as any }).eq("id", sid);
              setSchoolStatus("expired");
            }
          } else {
            // No active subscription at all
            setSubscriptionExpired(true);
          }
        }
      } else if (role === "teacher") {
        const { data: t } = await supabase
          .from("teachers")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();
        const sid = t?.school_id ?? null;
        setSchoolId(sid);
        if (sid) {
          const { data: school } = await supabase.from("schools").select("name, status").eq("id", sid).single();
          setSchoolName(school?.name ?? "");
          setSchoolStatus(school?.status ?? "active");

          // Check subscription for teacher's school too
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("end_date")
            .eq("school_id", sid)
            .eq("is_active", true)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (sub) {
            setSubscriptionEndDate(sub.end_date);
            setSubscriptionExpired(new Date(sub.end_date) < new Date());
          } else {
            setSubscriptionExpired(true);
          }
        }
      } else if (role === "student") {
        const { data: prof } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();
        setSchoolId(prof?.school_id ?? null);
      }
      setLoading(false);
    }
    fetch();
  }, [user, role]);

  const isReadOnly = subscriptionExpired || schoolStatus === "expired" || schoolStatus === "suspended" || schoolStatus === "inactive";

  return { schoolId, schoolName, setupCompleted, loading, schoolStatus, subscriptionExpired, subscriptionEndDate, isReadOnly };
}
