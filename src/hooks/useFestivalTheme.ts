import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FestivalTheme {
  id: string;
  name: string;
  emoji: string;
  banner_text: string;
  offer_text: string;
  gradient: string;
  animation_class: string;
  css_overrides: Record<string, string>;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  discount_percent: number;
  bonus_text: string;
  apply_to_whole_page: boolean;
}

// Default festival theme presets
export const FESTIVAL_PRESETS: Omit<FestivalTheme, "id" | "is_active" | "start_date" | "end_date">[] = [
  {
    name: "Diwali",
    emoji: "🪔",
    banner_text: "Light up your school with digital management ✨",
    offer_text: "Diwali Special: Get {discount}% OFF on all plans!",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    animation_class: "diwali-sparkle",
    css_overrides: {
      "--primary": "38 92% 50%",
      "--secondary": "25 95% 53%",
      "--accent": "0 84% 60%",
    },
    discount_percent: 30,
    bonus_text: "🎁 Free setup + Free staff training included",
    apply_to_whole_page: true,
  },
  {
    name: "Holi",
    emoji: "🎨",
    banner_text: "Add colors to your school management 🌈",
    offer_text: "Holi Special: {discount}% OFF + 1 Month FREE!",
    gradient: "from-pink-500 via-purple-500 to-blue-500",
    animation_class: "holi-colors",
    css_overrides: {
      "--primary": "280 68% 60%",
      "--secondary": "328 85% 58%",
      "--accent": "199 89% 48%",
    },
    discount_percent: 20,
    bonus_text: "🌈 Free 1-month premium on yearly plans",
    apply_to_whole_page: true,
  },
  {
    name: "Independence Day",
    emoji: "🇮🇳",
    banner_text: "Make your school independent from paperwork 🇮🇳",
    offer_text: "Independence Day: {discount}% OFF — Freedom from paperwork!",
    gradient: "from-orange-500 via-white to-green-600",
    animation_class: "tricolor-wave",
    css_overrides: {
      "--primary": "120 40% 35%",
      "--secondary": "38 92% 50%",
      "--accent": "25 95% 53%",
    },
    discount_percent: 25,
    bonus_text: "🏫 Free data migration + Priority support",
    apply_to_whole_page: true,
  },
  {
    name: "Back to School",
    emoji: "🧑‍🏫",
    banner_text: "New session, new start! Digitize your school today 🚀",
    offer_text: "Back-to-School Special: FREE {discount}-day trial + No setup fee!",
    gradient: "from-blue-600 via-indigo-500 to-purple-600",
    animation_class: "school-bounce",
    css_overrides: {
      "--primary": "221 83% 53%",
      "--secondary": "243 75% 59%",
      "--accent": "262 83% 58%",
    },
    discount_percent: 30,
    bonus_text: "📚 15-day free trial · No credit card needed",
    apply_to_whole_page: true,
  },
  {
    name: "Christmas & New Year",
    emoji: "🎄",
    banner_text: "New Year Gift: Buy 1 year, get 2 months FREE! 🎅",
    offer_text: "Christmas Offer: {discount}% OFF + 2 Months FREE!",
    gradient: "from-red-600 via-red-500 to-green-600",
    animation_class: "snow-fall",
    css_overrides: {
      "--primary": "0 72% 51%",
      "--secondary": "120 40% 35%",
      "--accent": "38 92% 50%",
    },
    discount_percent: 20,
    bonus_text: "🎁 Buy 1 year, get 2 months free",
    apply_to_whole_page: true,
  },
  {
    name: "Eid",
    emoji: "🌙",
    banner_text: "Simplify your school this festive season 🌙",
    offer_text: "Eid Special: {discount}% OFF on all plans!",
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    animation_class: "crescent-glow",
    css_overrides: {
      "--primary": "160 84% 39%",
      "--secondary": "175 77% 40%",
      "--accent": "187 92% 69%",
    },
    discount_percent: 15,
    bonus_text: "🤝 Free training + Priority WhatsApp support",
    apply_to_whole_page: true,
  },
];

/**
 * Hook to get the currently active festival theme.
 * Checks localStorage for admin-set themes, with date-range auto-activation.
 */
export function useFestivalTheme() {
  const [activeTheme, setActiveTheme] = useState<FestivalTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from localStorage (set by Super Admin)
    const stored = localStorage.getItem("festival_themes");
    if (stored) {
      try {
        const themes: FestivalTheme[] = JSON.parse(stored);
        const now = new Date();
        
        // Find first active theme within date range
        const active = themes.find(t => {
          if (!t.is_active) return false;
          if (t.start_date && new Date(t.start_date) > now) return false;
          if (t.end_date && new Date(t.end_date) < now) return false;
          return true;
        });
        
        setActiveTheme(active || null);
      } catch {
        setActiveTheme(null);
      }
    }
    
    // Also try loading from Supabase (for persistence across devices)
    supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "festival_themes")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const themes: FestivalTheme[] = typeof data.value === "string"
              ? JSON.parse(data.value)
              : data.value;
            const now = new Date();
            const active = themes.find(t => {
              if (!t.is_active) return false;
              if (t.start_date && new Date(t.start_date) > now) return false;
              if (t.end_date && new Date(t.end_date) < now) return false;
              return true;
            });
            setActiveTheme(active || null);
            // Cache to localStorage
            localStorage.setItem("festival_themes", JSON.stringify(themes));
          } catch {
            // Ignore parse errors
          }
        }
        setLoading(false);
      });
  }, []);

  return { activeTheme, loading };
}
