
-- Fix: Profiles INSERT policy - prevent users from self-assigning to any school
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id AND school_id IS NULL);
