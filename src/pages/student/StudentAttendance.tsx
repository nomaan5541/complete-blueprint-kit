import { useStudentData } from "@/hooks/useStudentData";
import { format } from "date-fns";
import { CalendarCheck, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { StudentEmpty, StudentPanel, StudentStatTile } from "@/components/student/StudentUI";

export default function StudentAttendancePage() {
  const { student, attendance, loading, presentDays, totalDays, attendanceRate } = useStudentData();

  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const absentDays = attendance.filter(a => a.status === "absent").length;
  const leaveDays = attendance.filter(a => a.status === "leave").length;

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StudentStatTile label="Overall" value={`${attendanceRate}%`} subtitle={`${presentDays}/${totalDays} days`} icon={CalendarCheck} tone="blue" />
        <StudentStatTile label="Present" value={presentDays} subtitle="Marked present" icon={CheckCircle2} tone="green" />
        <StudentStatTile label="Absent" value={absentDays} subtitle="Needs attention" icon={XCircle} tone="rose" />
        <StudentStatTile label="Leave" value={leaveDays} subtitle="Approved leave" icon={Clock3} tone="amber" />
      </div>

      <StudentPanel className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-extrabold text-lg">Last 60 Days</h2>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="student-chip">P</span><span className="student-chip">A</span><span className="student-chip">L</span>
          </div>
        </div>
        {attendance.length === 0 ? (
          <StudentEmpty title="No attendance marked yet" text="Your daily records will appear here." />
        ) : (
          <>
            <div className="grid grid-cols-7 sm:grid-cols-12 lg:grid-cols-15 gap-2">
              {attendance.map((a) => (
                <div
                  key={a.id}
                  title={`${format(new Date(a.date), "dd MMM yyyy")}: ${a.status}`}
                  className={`aspect-square rounded-xl text-xs flex items-center justify-center font-extrabold cursor-default border ${
                    a.status === "present" ? "bg-[hsl(var(--student-green)/0.16)] text-[hsl(var(--student-green))] border-[hsl(var(--student-green)/0.22)]" :
                    a.status === "absent" ? "bg-[hsl(var(--student-rose)/0.16)] text-[hsl(var(--student-rose))] border-[hsl(var(--student-rose)/0.22)]" :
                    "bg-[hsl(var(--student-amber)/0.16)] text-[hsl(var(--student-amber))] border-[hsl(var(--student-amber)/0.22)]"
                  }`}
                >
                  {a.status[0].toUpperCase()}
                </div>
              ))}
            </div>

            {attendance.some(a => a.status !== "present") && (
              <div className="mt-5 space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                {attendance.filter(a => a.status !== "present").map((a) => (
                  <div key={a.id} className="student-panel-soft rounded-2xl flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="truncate">{format(new Date(a.date), "dd MMM yyyy, EEEE")}</span>
                    <span className="student-chip capitalize shrink-0">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </StudentPanel>
    </div>
  );
}
