-- 1. Drop the loose INSERT policy on student_exam_attempts that bypasses strict exam guards
DROP POLICY IF EXISTS "Students insert own attempts" ON public.student_exam_attempts;

-- 2. Add SELECT policy for school admins on school_sms_config
CREATE POLICY "School admins view sms config"
ON public.school_sms_config
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM schools
  WHERE schools.id = school_sms_config.school_id
    AND schools.admin_id = auth.uid()
));

-- 3. Add SELECT policy for teachers on student_documents
CREATE POLICY "Teachers view school student documents"
ON public.student_documents
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM teachers
  WHERE teachers.school_id = student_documents.school_id
    AND teachers.user_id = auth.uid()
));