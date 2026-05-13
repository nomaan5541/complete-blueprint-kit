import { Bus, MapPin, Phone, Clock3 } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { StudentEmpty, StudentPanel, StudentStatTile } from "@/components/student/StudentUI";

export default function StudentTransport() {
  const { student, school, loading } = useStudentData();

  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <StudentPanel className="p-5 sm:p-6 overflow-hidden relative">
        <div className="flex items-center gap-4">
          <div className="student-icon-frame student-tone-amber h-16 w-16">
            <Bus className="h-9 w-9" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xl sm:text-3xl">School Transport</p>
            <p className="student-muted-text text-sm mt-1 truncate">{school?.name || "Your School"}</p>
          </div>
        </div>
        <Bus className="absolute right-4 bottom-2 h-24 w-24 text-[hsl(var(--student-amber)/0.08)]" />
      </StudentPanel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StudentStatTile label="Route" value="—" subtitle="Not assigned" icon={MapPin} tone="blue" />
        <StudentStatTile label="Pickup" value="—" subtitle="Contact admin" icon={Clock3} tone="green" />
        <StudentStatTile label="Driver" value="—" subtitle="Details pending" icon={Phone} tone="rose" />
      </div>

      <StudentEmpty
        icon={Bus}
        title="Transport details are not available yet"
        text="When the school assigns a route, pickup point, driver, and vehicle details, they will appear here."
      />
    </div>
  );
}
