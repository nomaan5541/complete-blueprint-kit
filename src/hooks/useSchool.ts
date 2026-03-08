import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useSchool() {
  const { user, role } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const [setupCompleted, setSetupCompleted] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) { setLoading(false); return; }
      if (role === "school_admin") {
        const { data } = await supabase
          .from("schools")
          .select("id, name, setup_completed")
          .eq("admin_id", user.id)
          .maybeSingle();
        setSchoolId(data?.id ?? null);
        setSchoolName(data?.name ?? "");
        setSetupCompleted((data as any)?.setup_completed ?? false);
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

  return { schoolId, schoolName, setupCompleted, loading };
}
