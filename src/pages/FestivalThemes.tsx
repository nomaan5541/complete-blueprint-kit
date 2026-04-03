import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Check, X, PartyPopper, Snowflake, Flame, Palette, Moon, Flag, Star, Gift } from "lucide-react";

const THEME_ICONS: Record<string, any> = {
  christmas: Snowflake,
  diwali: Flame,
  holi: Palette,
  eid: Moon,
  independence_day: Flag,
  republic_day: Flag,
  navratri: Star,
  new_year: PartyPopper,
};

const THEME_PREVIEWS: Record<string, string> = {
  christmas: "❄️🎄🎅 Snow falling, Christmas trees, lights, dark winter ambiance",
  diwali: "🪔✨🎆 Fireworks, floating diyas, golden sparkles, vibrant night",
  holi: "🎨💜💛 Color splashes, powder bursts, rainbow gradients",
  eid: "🌙⭐🕌 Floating lanterns, crescent moon, starry night",
  independence_day: "🇮🇳🎗️ Tricolor ribbons, flag animations, patriotic feel",
  republic_day: "🇮🇳🏛️ Tricolor parade, Ashoka chakra, patriotic theme",
  navratri: "🕉️💃🎶 Garba dancers, colorful dandiya, festive energy",
  new_year: "🎆🎉🥂 Confetti rain, countdown, fireworks, celebration",
};

export default function FestivalThemes() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  const fetchThemes = async () => {
    // Super admin can see all themes via their RLS policy
    const { data } = await supabase.from("festival_themes").select("*").order("name");
    setThemes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchThemes(); }, []);

  const handleActivate = async (themeId: string) => {
    setActivating(themeId);
    const { error } = await supabase.rpc("activate_festival_theme", { p_theme_id: themeId });
    if (error) toast.error(error.message);
    else {
      toast.success("Festival theme activated! Landing page updated.");
      fetchThemes();
    }
    setActivating(null);
  };

  const handleDeactivateAll = async () => {
    setActivating("deactivate");
    const { error } = await supabase.rpc("deactivate_all_festival_themes");
    if (error) toast.error(error.message);
    else {
      toast.success("All festival themes deactivated. Landing page restored to default.");
      fetchThemes();
    }
    setActivating(null);
  };

  const activeTheme = themes.find(t => t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> Festival Themes
          </h1>
          <p className="text-muted-foreground">Apply seasonal themes to the landing page with special offers & animations</p>
        </div>
        {activeTheme && (
          <Button variant="outline" onClick={handleDeactivateAll} disabled={activating === "deactivate"}>
            <X className="mr-2 h-4 w-4" /> Remove Active Theme
          </Button>
        )}
      </div>

      {activeTheme && (
        <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Currently Active: {activeTheme.name}</p>
            <p className="text-sm text-muted-foreground">{activeTheme.discount_percent}% discount • {activeTheme.animation_type} animation</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {themes.map(theme => {
          const Icon = THEME_ICONS[theme.theme_key] || Gift;
          const colors = theme.colors || {};
          const isActive = theme.is_active;
          const preview = THEME_PREVIEWS[theme.theme_key] || "Custom festival theme";

          return (
            <Card
              key={theme.id}
              className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isActive ? "ring-2 ring-primary shadow-lg" : ""
              }`}
            >
              {/* Color preview bar */}
              <div
                className="h-2 w-full"
                style={{
                  background: `linear-gradient(90deg, ${colors.primary || '#3b82f6'}, ${colors.secondary || '#8b5cf6'}, ${colors.accent || '#06b6d4'})`,
                }}
              />

              {isActive && (
                <Badge className="absolute top-4 right-3 bg-primary text-primary-foreground">
                  <Check className="h-3 w-3 mr-1" /> Active
                </Badge>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5" style={{ color: colors.primary }} />
                  {theme.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-bold text-foreground">{theme.discount_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Animation</span>
                    <span className="font-medium capitalize text-foreground">{theme.animation_type}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-border p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground block mb-1">Preview:</span>
                  {preview}
                </div>

                {/* Offer text preview */}
                {theme.offer_text && (
                  <div
                    className="rounded-lg p-2.5 text-xs font-medium text-center"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary || '#3b82f6'}20, ${colors.accent || '#06b6d4'}20)`,
                      color: colors.primary || '#3b82f6',
                    }}
                  >
                    {theme.offer_text.replace("{discount}", String(theme.discount_percent))}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={isActive ? "secondary" : "default"}
                  disabled={isActive || activating === theme.id}
                  onClick={() => handleActivate(theme.id)}
                >
                  {isActive ? (
                    <><Check className="mr-2 h-4 w-4" /> Currently Active</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Apply Theme</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">Loading themes...</div>
      )}
    </div>
  );
}
