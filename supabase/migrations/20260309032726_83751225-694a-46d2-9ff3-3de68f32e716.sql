-- Fix 1: Restrict platform_payment_settings to super_admin only
DROP POLICY IF EXISTS "Authenticated users view platform_payment_settings" ON public.platform_payment_settings;
CREATE POLICY "Super admins view platform_payment_settings"
  ON public.platform_payment_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix 2: Remove student access to exam_options table (they must use exam_options_student view)
DROP POLICY IF EXISTS "Students view exam_options" ON public.exam_options;