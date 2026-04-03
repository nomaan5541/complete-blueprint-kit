
-- Create festival_themes table
CREATE TABLE public.festival_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme_key TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER DEFAULT 0,
  offer_text TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  colors JSONB DEFAULT '{}',
  animation_type TEXT NOT NULL DEFAULT 'none',
  pricing_override JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.festival_themes ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all
CREATE POLICY "Super admins manage festival_themes"
ON public.festival_themes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Public can view active theme (for landing page)
CREATE POLICY "Anyone can view active festival theme"
ON public.festival_themes
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Ensure only one theme is active at a time via function
CREATE OR REPLACE FUNCTION public.activate_festival_theme(p_theme_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is super_admin
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Deactivate all themes
  UPDATE festival_themes SET is_active = false WHERE is_active = true;
  
  -- Activate selected theme
  UPDATE festival_themes SET is_active = true, updated_at = now() WHERE id = p_theme_id;
END;
$$;

-- Function to deactivate all themes
CREATE OR REPLACE FUNCTION public.deactivate_all_festival_themes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE festival_themes SET is_active = false WHERE is_active = true;
END;
$$;

-- Seed default festival themes
INSERT INTO public.festival_themes (name, theme_key, description, discount_percent, offer_text, animation_type, colors) VALUES
('Christmas', 'christmas', 'Celebrate the season of joy with special offers! Snow, lights, and holiday cheer.', 25, '🎄 Christmas Special: Get {discount}% OFF on all plans!', 'snow', '{"primary": "#c41e3a", "secondary": "#1a5c1a", "accent": "#ffd700", "bg": "#0a1628"}'),
('Diwali', 'diwali', 'Festival of Lights! Brighten your school management with amazing deals.', 30, '🪔 Diwali Dhamaka: {discount}% OFF + Free Setup!', 'fireworks', '{"primary": "#ff6b00", "secondary": "#ffd700", "accent": "#e91e63", "bg": "#1a0a2e"}'),
('Holi', 'holi', 'Festival of Colors! Splash amazing discounts on your school plans.', 20, '🎨 Holi Special: {discount}% OFF - Color Your Success!', 'colors', '{"primary": "#e91e63", "secondary": "#4caf50", "accent": "#ff9800", "bg": "#1a0a2e"}'),
('Eid', 'eid', 'Eid Mubarak! Special blessings with exclusive offers.', 20, '🌙 Eid Special: {discount}% OFF on All Plans!', 'lanterns', '{"primary": "#1b5e20", "secondary": "#ffd700", "accent": "#4caf50", "bg": "#0a1a0a"}'),
('Independence Day', 'independence_day', 'Celebrate India''s freedom with patriotic offers!', 15, '🇮🇳 Independence Day: {discount}% OFF - Jai Hind!', 'tricolor', '{"primary": "#ff9933", "secondary": "#ffffff", "accent": "#138808", "bg": "#0a1628"}'),
('Republic Day', 'republic_day', 'Honor the Constitution with republic day specials!', 15, '🇮🇳 Republic Day Sale: {discount}% OFF!', 'tricolor', '{"primary": "#ff9933", "secondary": "#ffffff", "accent": "#138808", "bg": "#1a1a2e"}'),
('Navratri', 'navratri', 'Nine nights of celebration with divine discounts!', 25, '🕉️ Navratri Special: {discount}% OFF - 9 Days of Savings!', 'garba', '{"primary": "#e91e63", "secondary": "#ff5722", "accent": "#ffc107", "bg": "#2a0a2e"}'),
('New Year', 'new_year', 'Ring in the New Year with spectacular deals!', 30, '🎆 New Year Sale: {discount}% OFF - Start Fresh!', 'confetti', '{"primary": "#ffd700", "secondary": "#ff4081", "accent": "#00e5ff", "bg": "#0a0a28"}');
