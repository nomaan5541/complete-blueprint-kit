import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FestivalTheme {
  id: string;
  name: string;
  theme_key: string;
  description: string;
  discount_percent: number;
  offer_text: string;
  animation_type: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    bg?: string;
  };
}

export function useFestivalTheme() {
  const [theme, setTheme] = useState<FestivalTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("festival_themes")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTheme({
            ...data,
            colors: typeof data.colors === "string" ? JSON.parse(data.colors) : (data.colors || {}),
          } as FestivalTheme);
        }
        setLoading(false);
      });
  }, []);

  return { theme, loading };
}
