import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      You are offline — some features may be limited
    </div>
  );
}
