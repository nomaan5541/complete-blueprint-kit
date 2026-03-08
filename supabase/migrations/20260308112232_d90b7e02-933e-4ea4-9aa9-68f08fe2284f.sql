
-- Create a SECURITY DEFINER function to get teacher's school_id without RLS
CREATE OR REPLACE FUNCTION public.get_teacher_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.teachers WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the recursive policy on schools
DROP POLICY IF EXISTS "Teachers view own school" ON public.schools;

-- Recreate using the security definer function
CREATE POLICY "Teachers view own school"
ON public.schools
FOR SELECT
TO authenticated
USING (id = public.get_teacher_school_id(auth.uid()));
