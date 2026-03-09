-- Remove sensitive SMS/WhatsApp API credentials from schools table
-- These credentials are already stored in school_sms_config with proper RLS
-- Exposing them in schools table allows all teachers and students to view them

-- First, ensure all credentials are migrated to school_sms_config
INSERT INTO public.school_sms_config (school_id, msg91_auth_key, msg91_sender_id, msg91_whatsapp_template_id)
SELECT 
  id as school_id,
  msg91_auth_key,
  msg91_sender_id,
  msg91_whatsapp_template_id
FROM public.schools
WHERE msg91_auth_key IS NOT NULL 
  OR msg91_sender_id IS NOT NULL 
  OR msg91_whatsapp_template_id IS NOT NULL
ON CONFLICT (school_id) 
DO UPDATE SET
  msg91_auth_key = COALESCE(EXCLUDED.msg91_auth_key, school_sms_config.msg91_auth_key),
  msg91_sender_id = COALESCE(EXCLUDED.msg91_sender_id, school_sms_config.msg91_sender_id),
  msg91_whatsapp_template_id = COALESCE(EXCLUDED.msg91_whatsapp_template_id, school_sms_config.msg91_whatsapp_template_id);

-- Now drop the credential columns from schools table
ALTER TABLE public.schools 
  DROP COLUMN IF EXISTS msg91_auth_key,
  DROP COLUMN IF EXISTS msg91_sender_id,
  DROP COLUMN IF EXISTS msg91_whatsapp_template_id;