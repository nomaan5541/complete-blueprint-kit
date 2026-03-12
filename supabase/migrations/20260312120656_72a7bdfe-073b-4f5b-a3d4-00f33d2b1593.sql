-- Remove the direct student SELECT policy on exam_options that exposes is_correct
DROP POLICY IF EXISTS "Students view exam_options via school" ON public.exam_options;
