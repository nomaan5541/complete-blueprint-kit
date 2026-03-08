
CREATE POLICY "Teachers view own record"
ON public.teachers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
