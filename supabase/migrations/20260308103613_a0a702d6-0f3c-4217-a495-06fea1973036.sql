
CREATE TABLE public.school_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  account_type text NOT NULL, -- 'teacher' or 'student'
  person_name text NOT NULL,
  email text NOT NULL,
  password_plain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own credentials"
ON public.school_credentials
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM schools WHERE schools.id = school_credentials.school_id AND schools.admin_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM schools WHERE schools.id = school_credentials.school_id AND schools.admin_id = auth.uid()
));

CREATE POLICY "Super admins manage credentials"
ON public.school_credentials
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
