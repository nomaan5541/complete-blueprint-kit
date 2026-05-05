DROP POLICY IF EXISTS "School admins update student documents" ON storage.objects;
CREATE POLICY "School admins update student documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (SELECT 1 FROM schools sc WHERE sc.admin_id = auth.uid()
    AND (sc.id)::text = (storage.foldername(objects.name))[1])
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND EXISTS (SELECT 1 FROM schools sc WHERE sc.admin_id = auth.uid()
    AND (sc.id)::text = (storage.foldername(objects.name))[1])
);

DROP POLICY IF EXISTS "Teachers upload study materials" ON storage.objects;
CREATE POLICY "Teachers upload study materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'study-materials'
  AND EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = auth.uid()
    AND (t.school_id)::text = (storage.foldername(objects.name))[1])
);

DROP POLICY IF EXISTS "Teachers update study materials" ON storage.objects;
CREATE POLICY "Teachers update study materials"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'study-materials'
  AND EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = auth.uid()
    AND (t.school_id)::text = (storage.foldername(objects.name))[1])
);

DROP POLICY IF EXISTS "School members view exam images" ON storage.objects;
CREATE POLICY "School members view exam images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'exam-images'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM exams e
      WHERE (storage.foldername(objects.name))[2] = e.id::text
        AND (
          EXISTS (SELECT 1 FROM schools s WHERE s.id = e.school_id AND s.admin_id = auth.uid())
          OR EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = auth.uid() AND t.school_id = e.school_id)
          OR EXISTS (SELECT 1 FROM students st WHERE st.user_id = auth.uid() AND st.status = 'active' AND st.school_id = e.school_id)
        )
    )
  )
);

DROP POLICY IF EXISTS "Teachers read student documents" ON storage.objects;
CREATE POLICY "Teachers read student documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1
    FROM teachers t
    JOIN students s
      ON s.school_id = t.school_id
     AND s.student_master_id::text = (storage.foldername(objects.name))[2]
    JOIN teacher_assignments ta
      ON ta.teacher_id = t.id
     AND ta.class_id = s.class_id
     AND ta.academic_year_id = s.academic_year_id
    WHERE t.user_id = auth.uid()
      AND (t.school_id)::text = (storage.foldername(objects.name))[1]
  )
);

DROP POLICY IF EXISTS "Students view exam_options" ON public.exam_options;
DROP POLICY IF EXISTS "Students view options" ON public.exam_options;
DROP POLICY IF EXISTS "Anyone can view exam_options" ON public.exam_options;

DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student AS
SELECT id, question_id, option_text, option_image
FROM public.exam_options;
GRANT SELECT ON public.exam_options_student TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.activate_festival_theme(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_all_festival_themes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_receipt_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_exam(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_school_active(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_school_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.activate_festival_theme(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_all_festival_themes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_receipt_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_active(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_school_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;