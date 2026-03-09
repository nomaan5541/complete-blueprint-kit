-- Platform payment settings for superadmin (QR/UPI for subscription payments)
CREATE TABLE public.platform_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_url text,
  upi_id text,
  payment_instructions text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users
);

-- Only super admins can manage platform payment settings
ALTER TABLE public.platform_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage platform_payment_settings" ON public.platform_payment_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Allow authenticated users to view payment settings (needed for schools to see payment details)
CREATE POLICY "Authenticated users view platform_payment_settings" ON public.platform_payment_settings
  FOR SELECT TO authenticated
  USING (true);

-- School payment config table for school admin Stripe API keys
CREATE TABLE public.school_payment_config (
  school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  stripe_publishable_key text,
  stripe_secret_key_encrypted text,
  payment_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.school_payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own payment_config" ON public.school_payment_config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools WHERE schools.id = school_payment_config.school_id AND schools.admin_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schools WHERE schools.id = school_payment_config.school_id AND schools.admin_id = auth.uid()
  ));

CREATE POLICY "Super admins manage school_payment_config" ON public.school_payment_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Create storage bucket for platform payment QR codes
INSERT INTO storage.buckets (id, name, public) VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT DO NOTHING;

-- Storage policies for platform-assets bucket
CREATE POLICY "Super admins upload platform assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins update platform assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins delete platform assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'platform-assets' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public read platform assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'platform-assets');