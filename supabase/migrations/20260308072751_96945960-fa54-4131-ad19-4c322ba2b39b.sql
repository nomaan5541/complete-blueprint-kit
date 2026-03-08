CREATE POLICY "Students view own school fee_structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.school_id = fee_structures.school_id
  )
);