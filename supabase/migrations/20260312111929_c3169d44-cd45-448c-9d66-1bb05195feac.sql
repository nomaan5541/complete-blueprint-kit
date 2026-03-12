
-- 1. Drop the student SELECT policy that exposes is_correct
DROP POLICY IF EXISTS "Students view exam_options via school" ON public.exam_options;

-- 2. Recreate view as SECURITY DEFINER (default) so it uses owner privileges
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student AS
SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

-- 3. Grant SELECT on the view to authenticated users
GRANT SELECT ON public.exam_options_student TO authenticated;
