import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AcademicYearSwitcher() {
  const { academicYears, selectedYearId, setSelectedYearId, selectedYear, loading } = useAcademicYear();

  if (loading || academicYears.length === 0) return null;

  return (
    <div className="flex items-center gap-2 ml-auto">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedYearId} onValueChange={setSelectedYearId}>
        <SelectTrigger className="w-44 h-8 text-xs border-dashed">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          {academicYears.map((y) => (
            <SelectItem key={y.id} value={y.id}>
              <span className="flex items-center gap-2">
                {y.name}
                {y.status === "active" && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Active</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
