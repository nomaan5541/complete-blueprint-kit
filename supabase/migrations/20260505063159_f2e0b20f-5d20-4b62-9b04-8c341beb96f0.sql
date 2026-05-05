
-- Scope teacher SELECT on students to assigned classes
DROP POLICY IF EXISTS "Teachers view own school students" ON public.students;
CREATE POLICY "Teachers view assigned class students"
ON public.students FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = students.school_id
      AND ta.class_id = students.class_id
  )
);

-- Scope teacher SELECT on student_master via students
DROP POLICY IF EXISTS "Teachers view own school student_master" ON public.student_master;
CREATE POLICY "Teachers view assigned class student_master"
ON public.student_master FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    JOIN public.students s ON s.student_master_id = student_master.id
    WHERE t.user_id = auth.uid()
      AND t.school_id = student_master.school_id
      AND ta.class_id = s.class_id
  )
);

-- Scope teacher SELECT on student_face_data via students
DROP POLICY IF EXISTS "Teachers view school face_data" ON public.student_face_data;
CREATE POLICY "Teachers view assigned class face_data"
ON public.student_face_data FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
    JOIN public.students s ON s.id = student_face_data.student_id
    WHERE t.user_id = auth.uid()
      AND t.school_id = student_face_data.school_id
      AND ta.class_id = s.class_id
  )
);
