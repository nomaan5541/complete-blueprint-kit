
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS id_card_template text DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS id_card_signature_url text;
