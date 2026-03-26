import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Save, Eye, Palette, Calendar, Gift, Percent } from "lucide-react";
import { FestivalTheme, FESTIVAL_PRESETS } from "@/hooks/useFestivalTheme";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function FestivalThemes() {
  const [themes, setThemes] = useState<FestivalTheme[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<FestivalTheme | null>(null);

  useEffect(() => {
    // Load from Supabase first, fallback to localStorage
    supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "festival_themes")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setThemes(parsed);
          localStorage.setItem("festival_themes", JSON.stringify(parsed));
        } else {
            const initial: FestivalTheme[] = FESTIVAL_PRESETS.map(p => ({
              ...p,
              id: generateId(),
              is_active: false,
              start_date: null,
              end_date: null,
              apply_to_whole_page: p.apply_to_whole_page ?? true,
            }));
          setThemes(initial);
        }
      });
  }, []);

  const handleToggle = (id: string, active: boolean) => {
    setThemes(prev => prev.map(t =>
      t.id === id ? { ...t, is_active: active } : t
    ));
  };

  const handleFieldChange = (id: string, field: keyof FestivalTheme, value: any) => {
    setThemes(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage immediately
    localStorage.setItem("festival_themes", JSON.stringify(themes));

    // Save to Supabase for persistence
    const { error } = await supabase
      .from("app_settings" as any)
      .upsert({
        key: "festival_themes",
        value: themes,
      } as any, { onConflict: "key" });

    if (error) {
      // If Supabase table doesn't exist, just use localStorage
      console.warn("Could not save to Supabase (app_settings may not exist), using localStorage only:", error.message);
      toast.success("Festival themes saved locally! Changes will apply to the landing page immediately.");
    } else {
      toast.success("Festival themes saved! Changes will apply to the landing page immediately.");
    }
    setSaving(false);
  };

  const activeCount = themes.filter(t => t.is_active).length;
  const now = new Date();
  const currentlyActive = themes.find(t => {
    if (!t.is_active) return false;
    if (t.start_date && new Date(t.start_date) > now) return false;
    if (t.end_date && new Date(t.end_date) < now) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> Festival & Seasonal Themes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage festival offers that auto-apply to the landing page with animations and discounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentlyActive && (
            <Badge className={`bg-gradient-to-r ${currentlyActive.gradient} text-white px-3 py-1`}>
              {currentlyActive.emoji} {currentlyActive.name} Active
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save & Apply"}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200">How Festival Themes Work</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                When a theme is <strong>active</strong> and within its date range, it automatically updates the landing page:
                the top banner changes, CSS colors adapt, and festival animations play. Only the first matching theme applies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Cards */}
      <div className="grid gap-4">
        {themes.map(theme => (
          <Card key={theme.id} className={`transition-all duration-300 ${theme.is_active ? "ring-2 ring-primary shadow-lg" : "opacity-80"}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Theme Icon & Gradient Preview */}
                <div className={`shrink-0 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white text-2xl shadow-lg`}>
                  {theme.emoji}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {theme.name}
                        {theme.is_active && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{theme.banner_text}</p>
                    </div>
                    <Switch
                      checked={theme.is_active}
                      onCheckedChange={(checked) => handleToggle(theme.id, checked)}
                    />
                  </div>

                  {/* Settings (shown when active) */}
                  {theme.is_active && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Start Date
                        </Label>
                        <Input
                          type="date"
                          value={theme.start_date || ""}
                          onChange={e => handleFieldChange(theme.id, "start_date", e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> End Date
                        </Label>
                        <Input
                          type="date"
                          value={theme.end_date || ""}
                          onChange={e => handleFieldChange(theme.id, "end_date", e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Percent className="h-3 w-3" /> Discount %
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={theme.discount_percent}
                          onChange={e => handleFieldChange(theme.id, "discount_percent", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Banner Text</Label>
                        <Input
                          value={theme.banner_text}
                          onChange={e => handleFieldChange(theme.id, "banner_text", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Offer Text (use {"{discount}"} for %)</Label>
                        <Input
                          value={theme.offer_text}
                          onChange={e => handleFieldChange(theme.id, "offer_text", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Bonus Text</Label>
                        <Input
                          value={theme.bonus_text}
                          onChange={e => handleFieldChange(theme.id, "bonus_text", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:col-span-2 lg:col-span-4 bg-muted/50 p-3 rounded-lg mt-2 cursor-pointer" onClick={() => handleFieldChange(theme.id, "apply_to_whole_page", !theme.apply_to_whole_page)}>
                        <div>
                          <Label className="text-sm font-semibold cursor-pointer">Apply to Entire Page (Full-Page Animation)</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            When enabled, the entire landing page will adopt the festival theme (e.g., falling snow for Christmas, sparkles for Diwali, full-page color gradients).
                          </p>
                        </div>
                        <Switch
                          checked={theme.apply_to_whole_page}
                          onCheckedChange={(checked) => handleFieldChange(theme.id, "apply_to_whole_page", checked)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {theme.is_active && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setPreviewTheme(theme)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview Banner
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Discount Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" /> Smart Discount Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-green-500">✅</span>
            <span>Combine discount with free setup (worth ₹2,000–₹5,000)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✅</span>
            <span>Add free training for staff as a bonus</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✅</span>
            <span>Extra months free increases perceived value</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✅</span>
            <span>Always set an end date for urgency</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">❌</span>
            <span>Avoid always-on discounts (kills brand value)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">❌</span>
            <span>Never go above 40% off (diminishing returns)</span>
          </div>
        </CardContent>
      </Card>

      {/* Banner Preview Dialog */}
      <Dialog open={!!previewTheme} onOpenChange={() => setPreviewTheme(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Banner Preview — {previewTheme?.name}</DialogTitle>
          </DialogHeader>
          {previewTheme && (
            <div className="space-y-0">
              {/* Simulated Banner */}
              <div className={`bg-gradient-to-r ${previewTheme.gradient} text-white py-3 px-6 text-center font-medium ${previewTheme.animation_class}`}>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-lg">{previewTheme.emoji}</span>
                  <span>
                    {previewTheme.offer_text.replace("{discount}", String(previewTheme.discount_percent))}
                  </span>
                </div>
                <div className="text-xs opacity-90 mt-1">{previewTheme.bonus_text}</div>
              </div>
              <div className="p-6 text-sm text-muted-foreground">
                <p><strong>CSS Overrides:</strong> Primary, secondary, and accent colors will change to match {previewTheme.name} theme.</p>
                <p className="mt-2"><strong>Animation:</strong> <code>{previewTheme.animation_class}</code> will play on the top banner.</p>
              </div>
            </div>
          )}
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setPreviewTheme(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
