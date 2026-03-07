import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration and preferences</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          <Settings className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">Settings module will be available in a future update.</p>
          <p className="text-sm">System preferences, email templates, and configuration will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
