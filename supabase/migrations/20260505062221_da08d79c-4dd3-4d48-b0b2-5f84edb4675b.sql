
-- 1. Tighten student_documents SELECT for teachers (must be in assigned class)
DROP POLICY IF EXISTS "Teachers view school student documents" ON public.student_documents;
CREATE POLICY "Teachers view assigned class student documents"
ON public.student_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    JOIN public.students s ON s.id = student_documents.student_id
    WHERE t.user_id = auth.uid()
      AND t.school_id = student_documents.school_id
      AND ta.class_id = s.class_id
  )
);

-- 2. Scope exam-images upload to teacher's school exams
DROP POLICY IF EXISTS "School staff upload exam images" ON storage.objects;
CREATE POLICY "School staff upload exam images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-images'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.exams e
      WHERE (storage.foldername(name))[2] = e.id::text
        AND (
          EXISTS (SELECT 1 FROM public.schools s WHERE s.id = e.school_id AND s.admin_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.user_id = auth.uid() AND t.school_id = e.school_id)
        )
    )
  )
);

-- 3. Revoke EXECUTE from anon/PUBLIC on SECURITY DEFINER trigger fns
REVOKE EXECUTE ON FUNCTION public.check_subscription_request_rate_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_contact_message_rate_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_school_active() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_school_defaults() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
