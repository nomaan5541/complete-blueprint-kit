import { useStudentData } from "@/hooks/useStudentData";
import { Calendar, BookOpen, ClipboardList } from "lucide-react";
import { format, isPast } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentHomework() {
  const { student, homeworkList, loading } = useStudentData();
  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const upcoming = homeworkList.filter((h: any) => h.due_date && new Date(h.due_date) >= new Date());
  const past = homeworkList.filter((h: any) => h.due_date && new Date(h.due_date) < new Date());

  return (
    <div className="space-y-5 pb-6 pt-2 animate-fade-in">
      <Section title={`Pending (${upcoming.length})`} icon={ClipboardList} items={upcoming} tone="student-tone-amber" />
      {past.length > 0 && <Section title={`Past (${past.length})`} icon={BookOpen} items={past} tone="student-tone-blue" faded />}
      {upcoming.length === 0 && past.length === 0 && (
        <StudentEmpty icon={ClipboardList} title="No homework yet" text="When teachers assign work it will appear here." />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, items, tone, faded }: any) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`student-mini-icon ${tone}`}><Icon className="h-4 w-4" /></span>
        <h2 className="font-extrabold text-base">{title}</h2>
      </div>
      <div className="space-y-2.5">
        {items.map((hw: any) => {
          const overdue = hw.due_date && isPast(new Date(hw.due_date));
          return (
            <StudentPanel key={hw.id} className={`p-4 ${faded ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{hw.title}</p>
                  <p className="text-[11px] student-muted-text mt-1">{hw.subjects?.name}{hw.teachers?.name && ` • ${hw.teachers.name}`}</p>
                  {hw.description && <p className="text-xs mt-2 leading-relaxed line-clamp-3 text-[hsl(var(--student-foreground)/0.85)]">{hw.description}</p>}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${overdue ? "bg-[hsl(var(--student-rose)/0.16)] text-[hsl(var(--student-rose))]" : "bg-[hsl(var(--student-primary)/0.16)] text-[hsl(var(--student-primary))]"}`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(hw.due_date), "dd MMM")}
                </span>
              </div>
            </StudentPanel>
          );
        })}
      </div>
    </section>
  );
}
