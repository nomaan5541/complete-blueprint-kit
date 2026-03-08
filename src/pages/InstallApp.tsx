import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Bell, WifiOff, Camera, Check } from "lucide-react";
import PushNotificationManager from "@/components/PushNotificationManager";

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: WifiOff, title: "Offline Access", desc: "View cached data even without internet" },
    { icon: Bell, title: "Push Notifications", desc: "Get real-time alerts for attendance, fees & exams" },
    { icon: Camera, title: "Camera & File Upload", desc: "Capture documents and photos directly" },
    { icon: Smartphone, title: "Home Screen App", desc: "Launch instantly like a native app" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <img src="/pwa-192x192.png" alt="EDUPRIMEX" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold">EDUPRIMEX</h1>
          <p className="text-muted-foreground">Install the app for the best experience</p>
        </div>

        <div className="grid gap-3">
          {features.map((f) => (
            <Card key={f.title} className="border-muted">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {isInstalled ? (
            <Button className="w-full gap-2" disabled>
              <Check className="h-4 w-4" /> App Installed
            </Button>
          ) : deferredPrompt ? (
            <Button className="w-full gap-2" size="lg" onClick={handleInstall}>
              <Download className="h-5 w-5" /> Install App
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground text-center space-y-2">
                <p className="font-medium">To install on your device:</p>
                <p><strong>Android:</strong> Tap the browser menu (⋮) → "Install app"</p>
                <p><strong>iPhone:</strong> Tap Share (↑) → "Add to Home Screen"</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <PushNotificationManager />
          </div>
        </div>
      </div>
    </div>
  );
}
