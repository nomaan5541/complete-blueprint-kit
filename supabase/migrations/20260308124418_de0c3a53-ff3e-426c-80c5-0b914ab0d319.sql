-- 1. Drop password_plain column from school_credentials
ALTER TABLE public.school_credentials DROP COLUMN IF EXISTS password_plain;

-- 2. Fix student-documents storage INSERT/DELETE policies
DROP POLICY IF EXISTS "School admins upload student docs" ON storage.objects;
DROP POLICY IF EXISTS "School admins delete student docs" ON storage.objects;

CREATE POLICY "School-scoped student doc upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      EXISTS (SELECT 1 FROM public.schools
              WHERE schools.id::text = split_part(name, '/', 1)
              AND schools.admin_id = auth.uid())
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

CREATE POLICY "School-scoped student doc delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (SELECT 1 FROM public.schools
              WHERE schools.id::text = split_part(name, '/', 1)
              AND schools.admin_id = auth.uid())
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

-- 3. Drop "Students view exam_options" policy (students should use exam_options_student view)
DROP POLICY IF EXISTS "Students view exam_options" ON public.exam_options;

-- 4. Restrict profile updates to prevent school_id modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      school_id IS NOT DISTINCT FROM (SELECT p.school_id FROM public.profiles p WHERE p.user_id = auth.uid())
    )
  );