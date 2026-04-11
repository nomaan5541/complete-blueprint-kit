
-- Drop and recreate the exam_options_student view as SECURITY DEFINER + SECURITY BARRIER
-- This ensures students can read options but NEVER see is_correct
DROP VIEW IF EXISTS public.exam_options_student;

CREATE VIEW public.exam_options_student
WITH (security_barrier = true)
AS
SELECT
  eo.id,
  eo.question_id,
  eo.option_text,
  eo.option_image,
  eo.created_at
FROM public.exam_options eo
JOIN public.exam_questions eq ON eq.id = eo.question_id
JOIN public.exams e ON e.id = eq.exam_id
WHERE e.status = 'published';

-- Make it SECURITY DEFINER so it bypasses RLS on exam_options (students have no direct policy)
-- but the view itself filters to published exams only and excludes is_correct
ALTER VIEW public.exam_options_student SET (security_invoker = false);

-- Grant SELECT to authenticated so students can query via this view
GRANT SELECT ON public.exam_options_student TO authenticated;
