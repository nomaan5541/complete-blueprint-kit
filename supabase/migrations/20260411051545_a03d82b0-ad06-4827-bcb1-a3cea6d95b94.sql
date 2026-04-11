-- Recreate exam_options_student view: remove security_invoker so students can
-- read through it, and add filtering to only show options for published exams.
-- is_correct is NOT included, protecting answer integrity.
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student AS
SELECT eo.id, eo.question_id, eo.option_text, eo.option_image, eo.created_at
FROM public.exam_options eo
JOIN public.exam_questions eq ON eq.id = eo.question_id
JOIN public.exams e ON e.id = eq.exam_id
WHERE e.status = 'published';

GRANT SELECT ON public.exam_options_student TO authenticated;
GRANT SELECT ON public.exam_options_student TO anon;