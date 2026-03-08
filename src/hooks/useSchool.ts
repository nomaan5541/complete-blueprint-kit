import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useSchool() {
  const { user, role } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!user) { setLoading(false); return; }
      if (role === "school_admin") {
        const { data } = await supabase
          .from("schools")
          .select("id, name")
          .eq("admin_id", user.id)
          .maybeSingle();
        setSchoolId(data?.id ?? null);
        setSchoolName(data?.name ?? "");
      }
      setLoading(false);
    }
    fetch();
  }, [user, role]);

  return { schoolId, schoolName, loading };
}
