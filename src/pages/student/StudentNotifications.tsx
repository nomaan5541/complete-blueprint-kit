import { useStudentData } from "@/hooks/useStudentData";
import { Bell, Megaphone, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentNotifications() {
  const { student, notifications, loading } = useStudentData();
  if (loading) return <div className="pt-4 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />)}</div>;
  if (!student) return <StudentEmpty title="No student record found" text="Please contact your school admin." />;

  if (notifications.length === 0) {
    return <div className="pt-4"><StudentEmpty icon={Bell} title="You're all caught up" text="No notifications right now. We'll alert you when something new arrives." /></div>;
  }

  return (
    <div className="space-y-2.5 pb-6 pt-2 animate-fade-in">
      {notifications.map((n: any) => {
        const isAnn = n.type === "announcement";
        const isAlert = n.type === "alert";
        const Icon = isAnn ? Megaphone : isAlert ? AlertCircle : Bell;
        const tone = isAnn ? "student-tone-violet" : isAlert ? "student-tone-rose" : "student-tone-blue";
        return (
          <StudentPanel key={n.id} className="p-4 flex items-start gap-3">
            <span className={`student-mini-icon ${tone} h-11 w-11`}><Icon className="h-5 w-5" /></span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm">{n.title}</p>
                <span className="text-[10px] student-muted-text shrink-0">{format(new Date(n.created_at), "dd MMM")}</span>
              </div>
              <p className="text-xs student-muted-text mt-1 leading-relaxed">{n.message}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--student-surface-2)/0.6)] student-muted-text capitalize">{n.type}</span>
            </div>
          </StudentPanel>
        );
      })}
    </div>
  );
}
