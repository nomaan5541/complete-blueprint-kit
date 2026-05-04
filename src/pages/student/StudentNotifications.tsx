import { useStudentData } from "@/hooks/useStudentData";
import { Bell } from "lucide-react";
import { format } from "date-fns";

export default function StudentNotifications() {
  const { student, notifications, loading } = useStudentData();
  if (loading) return <div className="pt-4 h-64 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  return (
    <div className="space-y-2.5 pb-6 pt-2">
      {notifications.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-sm text-slate-400">
          No notifications yet
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm">{n.title}</p>
                <span className="text-[10px] text-slate-400 shrink-0">{format(new Date(n.created_at), "dd MMM")}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{n.message}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{n.type}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
