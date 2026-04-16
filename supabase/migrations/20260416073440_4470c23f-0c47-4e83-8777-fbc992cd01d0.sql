
-- Fix 1: Student documents storage policy - disambiguate 'name' column reference
-- The bug: `storage.foldername(name)` inside a subquery with alias `s` resolves `name` to `s.name` (student name) instead of `storage.objects.name`
DROP POLICY IF EXISTS "Students read own documents" ON storage.objects;

CREATE POLICY "Students read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.school_id::text = (storage.foldername(storage.objects.name))[1]
      AND s.id::text = (storage.foldername(storage.objects.name))[2]
      AND s.status = 'active'
  )
);

-- Fix 2: Study materials storage read policy - add school-level scoping via path
DROP POLICY IF EXISTS "School members read study materials" ON storage.objects;

CREATE POLICY "School members read study materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.admin_id = auth.uid()
        AND schools.id::text = (storage.foldername(storage.objects.name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teachers.user_id = auth.uid()
        AND teachers.school_id::text = (storage.foldername(storage.objects.name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM public.students
      WHERE students.user_id = auth.uid()
        AND students.status = 'active'
        AND students.school_id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- Fix 3: Replace always-true subscription_requests INSERT policy with proper check
DROP POLICY IF EXISTS "Authenticated users submit subscription requests" ON public.subscription_requests;

CREATE POLICY "Authenticated users submit subscription requests"
ON public.subscription_requests
FOR INSERT TO authenticated
WITH CHECK (
  email IS NOT NULL AND length(trim(email)) > 0
  AND school_name IS NOT NULL AND length(trim(school_name)) > 0
  AND contact_name IS NOT NULL AND length(trim(contact_name)) > 0
);
