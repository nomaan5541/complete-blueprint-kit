import { useStudentData } from "@/hooks/useStudentData";
import { Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function StudentHomework() {
  const { student, homeworkList, loading } = useStudentData();
  if (loading) return <div className="pt-4 h-64 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  const upcoming = homeworkList.filter((h: any) => new Date(h.due_date) >= new Date());
  const past = homeworkList.filter((h: any) => new Date(h.due_date) < new Date());

  return (
    <div className="space-y-4 pb-6 pt-2">
      <Section title={`Pending (${upcoming.length})`} icon={BookOpen} items={upcoming} />
      {past.length > 0 && <Section title="Past" icon={BookOpen} items={past} faded />}
    </div>
  );
}

function Section({ title, icon: Icon, items, faded }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-300" />
        <p className="font-bold text-sm">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-400">No items</p>
      ) : (
        <div className="divide-y divide-white/5">
          {items.map((hw: any) => (
            <div key={hw.id} className={`p-4 ${faded ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{hw.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{hw.subjects?.name} • {hw.teachers?.name}</p>
                  {hw.description && <p className="text-xs text-slate-300 mt-2 line-clamp-2">{hw.description}</p>}
                </div>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-300 inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(hw.due_date), "dd MMM")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
