-- Contact form submissions table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rate limiting trigger to prevent spam (max 3 per email per hour)
CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.contact_messages
      WHERE email = NEW.email AND created_at > now() - interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Too many messages submitted. Please try again later.';
  END IF;
  -- Length validation
  IF length(NEW.name) > 100 OR length(NEW.email) > 255 OR length(NEW.message) > 2000
     OR length(coalesce(NEW.subject, '')) > 200 THEN
    RAISE EXCEPTION 'Field length exceeds allowed limit.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_messages_rate_limit
BEFORE INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.check_contact_message_rate_limit();

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous or authenticated) can submit a contact message
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(trim(name)) > 0
  AND email IS NOT NULL AND length(trim(email)) > 0
  AND message IS NOT NULL AND length(trim(message)) > 0
);

-- Only super admins can view/manage messages
CREATE POLICY "Super admins view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins update contact messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins delete contact messages"
ON public.contact_messages FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages(is_read);