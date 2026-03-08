import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SchoolSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Settings</h1>
        <p className="text-muted-foreground">Configure school preferences</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          <Settings className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">School settings will be available in a future update.</p>
          <p className="text-sm">Grading system, fee structure templates, and other configurations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
