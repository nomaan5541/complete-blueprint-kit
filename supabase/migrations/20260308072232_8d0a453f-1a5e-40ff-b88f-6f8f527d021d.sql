ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS msg91_auth_key text DEFAULT NULL;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS msg91_sender_id text DEFAULT NULL;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS msg91_whatsapp_template_id text DEFAULT NULL;