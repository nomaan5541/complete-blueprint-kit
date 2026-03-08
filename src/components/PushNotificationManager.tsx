import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Push notifications enabled!");
        // Show a test notification
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("EDUPRIMEX", {
          body: "Notifications are now enabled! You'll receive updates here.",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
        });
      } else if (result === "denied") {
        toast.error("Notifications were blocked. Enable them in browser settings.");
      }
    } catch {
      toast.error("Failed to enable notifications");
    }
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3">
      {permission === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-success">
          <Bell className="h-4 w-4" />
          <span>Notifications enabled</span>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={requestPermission} className="gap-2">
          {permission === "denied" ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {permission === "denied" ? "Notifications blocked" : "Enable Notifications"}
        </Button>
      )}
    </div>
  );
}
