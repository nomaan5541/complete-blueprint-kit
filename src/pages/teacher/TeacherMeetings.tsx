import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";

export default function TeacherMeetings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meetings</h1>
        <p className="text-muted-foreground">Join and manage virtual meetings</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Video className="h-10 w-10 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Coming Soon</Badge>
          <h2 className="text-xl font-semibold mb-2">Virtual Meetings</h2>
          <p className="text-muted-foreground text-center max-w-md text-sm">
            Soon you'll be able to join virtual meetings with school admins, fellow teachers, and parents — right from your dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
