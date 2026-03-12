
-- Drop the student SELECT policy on exam_options that exposes is_correct
DROP POLICY IF EXISTS "Students view exam_options via school" ON public.exam_options;

-- Ensure the safe view exists (excludes is_correct)
CREATE OR REPLACE VIEW public.exam_options_student
WITH (security_invoker = true)
AS SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

-- Grant access to the view
GRANT SELECT ON public.exam_options_student TO authenticated;
