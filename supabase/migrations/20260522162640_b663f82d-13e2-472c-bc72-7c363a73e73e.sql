DROP POLICY IF EXISTS "Teachers view exam_options" ON public.exam_options;

CREATE POLICY "Teachers view assigned exam_options"
ON public.exam_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exam_questions q
    JOIN public.exams e ON e.id = q.exam_id
    JOIN public.teachers t ON t.school_id = e.school_id
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE q.id = exam_options.question_id
      AND t.user_id = auth.uid()
      AND (e.class_id IS NULL OR ta.class_id = e.class_id)
  )
);