
-- Allow teachers to view their own school
CREATE POLICY "Teachers view own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers
    WHERE teachers.school_id = schools.id
    AND teachers.user_id = auth.uid()
  )
);

-- Allow students to view their own school
CREATE POLICY "Students view own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.school_id = schools.id
    AND profiles.user_id = auth.uid()
  )
);
