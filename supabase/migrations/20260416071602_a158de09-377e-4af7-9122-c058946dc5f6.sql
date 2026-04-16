
-- Fix 1: Tighten exam_options policies from {public} to {authenticated}
DROP POLICY IF EXISTS "School admins manage exam_options" ON public.exam_options;
DROP POLICY IF EXISTS "Super admins manage exam_options" ON public.exam_options;
DROP POLICY IF EXISTS "Teachers view exam_options" ON public.exam_options;

CREATE POLICY "School admins manage exam_options"
ON public.exam_options FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM exam_questions q
  JOIN exams e ON e.id = q.exam_id
  JOIN schools s ON s.id = e.school_id
  WHERE q.id = exam_options.question_id AND s.admin_id = auth.uid()
));

CREATE POLICY "Super admins manage exam_options"
ON public.exam_options FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Teachers view exam_options"
ON public.exam_options FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM exam_questions q
  JOIN exams e ON e.id = q.exam_id
  JOIN teachers t ON t.school_id = e.school_id
  WHERE q.id = exam_options.question_id AND t.user_id = auth.uid()
));

-- Fix 2: Replace email enumeration in subscription_requests INSERT policy with a trigger
DROP POLICY IF EXISTS "Authenticated users submit subscription requests" ON public.subscription_requests;

CREATE POLICY "Authenticated users submit subscription requests"
ON public.subscription_requests
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create trigger to enforce rate limiting server-side
CREATE OR REPLACE FUNCTION public.check_subscription_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.subscription_requests sr
    WHERE sr.email = NEW.email
      AND sr.created_at > now() - interval '1 day'
  ) THEN
    RAISE EXCEPTION 'A request with this email was already submitted recently. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_subscription_request_rate ON public.subscription_requests;
CREATE TRIGGER check_subscription_request_rate
BEFORE INSERT ON public.subscription_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_subscription_request_rate_limit();

-- Fix 3: Recreate student-documents admin UPDATE storage policy with correct column reference
DROP POLICY IF EXISTS "School admins update student documents" ON storage.objects;

CREATE POLICY "School admins update student documents"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.schools sc
    WHERE sc.admin_id = auth.uid()
      AND sc.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.schools sc
    WHERE sc.admin_id = auth.uid()
      AND sc.id::text = (storage.foldername(name))[1]
  )
);
