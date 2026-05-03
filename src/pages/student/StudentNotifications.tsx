import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Bell } from "lucide-react";

export default function StudentNotifications() {
  const { student, notifications, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> All Notices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{n.type}</Badge>
                  <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd MMM yyyy, hh:mm a")}</span>
                </div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
