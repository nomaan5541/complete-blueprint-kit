
-- exam_marks: replace school-wide teacher SELECT with class-scoped
DROP POLICY IF EXISTS "Teachers view own school exam_marks" ON public.exam_marks;
CREATE POLICY "Teachers view assigned class exam_marks"
ON public.exam_marks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = exam_marks.school_id
      AND ta.class_id = exam_marks.class_id
  )
);

-- student_exam_attempts: class-scoped teacher SELECT
DROP POLICY IF EXISTS "Teachers view student_exam_attempts" ON public.student_exam_attempts;
CREATE POLICY "Teachers view assigned class student_exam_attempts"
ON public.student_exam_attempts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    JOIN public.students s ON s.id = student_exam_attempts.student_id
    WHERE t.user_id = auth.uid()
      AND t.school_id = s.school_id
      AND ta.class_id = s.class_id
  )
);

-- student_answers: class-scoped teacher SELECT
DROP POLICY IF EXISTS "Teachers view student_answers" ON public.student_answers;
CREATE POLICY "Teachers view assigned class student_answers"
ON public.student_answers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_exam_attempts a
    JOIN public.students s ON s.id = a.student_id
    JOIN public.teachers t ON t.school_id = s.school_id
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id AND ta.class_id = s.class_id
    WHERE a.id = student_answers.attempt_id
      AND t.user_id = auth.uid()
  )
);
