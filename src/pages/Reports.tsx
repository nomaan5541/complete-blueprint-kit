import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analytics and reporting dashboard</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">Reports module will be available in a future update.</p>
          <p className="text-sm">School performance, financial, and academic analytics will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
