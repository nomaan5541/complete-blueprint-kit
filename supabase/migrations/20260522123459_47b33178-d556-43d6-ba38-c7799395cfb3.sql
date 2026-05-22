
-- 1. Attendance: scope teacher policies to assigned classes
DROP POLICY IF EXISTS "Teachers view own school attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers delete attendance" ON public.attendance;

CREATE POLICY "Teachers view assigned class attendance"
ON public.attendance FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = attendance.school_id
      AND ta.class_id = attendance.class_id
  )
);

CREATE POLICY "Teachers insert attendance for assigned classes"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = attendance.school_id
      AND ta.class_id = attendance.class_id
  )
);

CREATE POLICY "Teachers update attendance for assigned classes"
ON public.attendance FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = attendance.school_id
      AND ta.class_id = attendance.class_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = attendance.school_id
      AND ta.class_id = attendance.class_id
  )
);

CREATE POLICY "Teachers delete attendance for assigned classes"
ON public.attendance FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = attendance.school_id
      AND ta.class_id = attendance.class_id
  )
);

-- 2. Exam questions: scope student access to their class/section
DROP POLICY IF EXISTS "Students view published exam_questions" ON public.exam_questions;

CREATE POLICY "Students view published exam_questions"
ON public.exam_questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.students s ON s.school_id = e.school_id
    WHERE e.id = exam_questions.exam_id
      AND s.user_id = auth.uid()
      AND s.status = 'active'
      AND e.status = 'published'
      AND (e.class_id IS NULL OR e.class_id = s.class_id)
      AND (e.section_id IS NULL OR e.section_id = s.section_id)
  )
);
