
-- Fix exam_options_student view: use security_invoker instead of security_barrier
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student WITH (security_invoker = true) AS
SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

GRANT SELECT ON public.exam_options_student TO authenticated;
GRANT SELECT ON public.exam_options_student TO anon;

-- Fix school_sms_config_safe view: use security_invoker
DROP VIEW IF EXISTS public.school_sms_config_safe;
CREATE VIEW public.school_sms_config_safe WITH (security_invoker = true) AS
SELECT school_id, msg91_sender_id, msg91_whatsapp_template_id,
  CASE WHEN msg91_auth_key IS NOT NULL AND msg91_auth_key != '' THEN true ELSE false END AS key_configured,
  created_at, updated_at
FROM public.school_sms_config;

GRANT SELECT ON public.school_sms_config_safe TO authenticated;
