
-- Fix 1: Add authorization check to generate_receipt_number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_school_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_counter integer;
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM schools WHERE id = p_school_id AND admin_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE schools
  SET receipt_counter = receipt_counter + 1
  WHERE id = p_school_id
  RETURNING receipt_prefix, receipt_counter INTO v_prefix, v_counter;

  RETURN v_prefix || '-' || LPAD(v_counter::text, 4, '0');
END;
$$;

-- Fix 2: Create school_sms_config table for MSG91 credentials (admin-only)
CREATE TABLE IF NOT EXISTS public.school_sms_config (
  school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  msg91_auth_key text,
  msg91_sender_id text,
  msg91_whatsapp_template_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.school_sms_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own sms config"
  ON public.school_sms_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = school_sms_config.school_id AND schools.admin_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.schools WHERE schools.id = school_sms_config.school_id AND schools.admin_id = auth.uid()));

CREATE POLICY "Super admins manage sms config"
  ON public.school_sms_config FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Migrate existing data
INSERT INTO public.school_sms_config (school_id, msg91_auth_key, msg91_sender_id, msg91_whatsapp_template_id)
SELECT id, msg91_auth_key, msg91_sender_id, msg91_whatsapp_template_id
FROM public.schools
WHERE msg91_auth_key IS NOT NULL OR msg91_sender_id IS NOT NULL OR msg91_whatsapp_template_id IS NOT NULL
ON CONFLICT (school_id) DO NOTHING;

-- Null out credentials from schools table
UPDATE public.schools SET msg91_auth_key = NULL, msg91_sender_id = NULL, msg91_whatsapp_template_id = NULL;

-- Fix 3: Fix school-logos storage policies
DROP POLICY IF EXISTS "Authenticated users can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete school logos" ON storage.objects;

CREATE POLICY "School admins upload own logo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'school-logos'
    AND EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id::text = split_part(name, '/', 1)
      AND schools.admin_id = auth.uid()
    )
  );

CREATE POLICY "School admins update own logo" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id::text = split_part(name, '/', 1)
      AND schools.admin_id = auth.uid()
    )
  );

CREATE POLICY "School admins delete own logo" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id::text = split_part(name, '/', 1)
      AND schools.admin_id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage school logos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'school-logos' AND has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (bucket_id = 'school-logos' AND has_role(auth.uid(), 'super_admin'::app_role));
