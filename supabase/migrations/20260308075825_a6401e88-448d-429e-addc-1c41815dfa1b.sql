
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  plan_id uuid REFERENCES public.subscription_plans(id),
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit subscription requests"
ON public.subscription_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only super admins can view/manage
CREATE POLICY "Super admins manage subscription_requests"
ON public.subscription_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
