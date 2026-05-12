-- Fix cross-tenant delete on exam-images storage bucket
DROP POLICY IF EXISTS "School staff delete exam images" ON storage.objects;

CREATE POLICY "School staff delete exam images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-images'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.schools WHERE admin_id = auth.uid() LIMIT 1
  )
);

-- Class-scope teacher INSERT/UPDATE on exam_marks
DROP POLICY IF EXISTS "Teachers insert exam_marks" ON public.exam_marks;
DROP POLICY IF EXISTS "Teachers update exam_marks" ON public.exam_marks;

CREATE POLICY "Teachers insert exam_marks"
ON public.exam_marks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = exam_marks.school_id
      AND ta.class_id = exam_marks.class_id
  )
);

CREATE POLICY "Teachers update exam_marks"
ON public.exam_marks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = exam_marks.school_id
      AND ta.class_id = exam_marks.class_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = exam_marks.school_id
      AND ta.class_id = exam_marks.class_id
  )
);