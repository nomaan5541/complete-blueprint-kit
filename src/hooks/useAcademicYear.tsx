import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";

interface AcademicYearContextType {
  academicYears: any[];
  selectedYearId: string;
  setSelectedYearId: (id: string) => void;
  selectedYear: any | null;
  loading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const { schoolId } = useSchool();
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearIdState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId!)
        .order("start_date", { ascending: false });
      const years = data || [];
      setAcademicYears(years);

      // Restore from localStorage or default to active year
      const stored = localStorage.getItem(`ay_${schoolId}`);
      const storedValid = stored && years.some((y: any) => y.id === stored);
      if (storedValid) {
        setSelectedYearIdState(stored!);
      } else {
        const active = years.find((y: any) => y.status === "active");
        setSelectedYearIdState(active?.id || years[0]?.id || "");
      }
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  const setSelectedYearId = (id: string) => {
    setSelectedYearIdState(id);
    if (schoolId) localStorage.setItem(`ay_${schoolId}`, id);
  };

  const selectedYear = academicYears.find((y) => y.id === selectedYearId) || null;

  return (
    <AcademicYearContext.Provider value={{ academicYears, selectedYearId, setSelectedYearId, selectedYear, loading }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error("useAcademicYear must be used within AcademicYearProvider");
  return ctx;
}
