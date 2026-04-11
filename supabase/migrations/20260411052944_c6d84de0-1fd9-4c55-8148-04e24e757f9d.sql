
-- 1. Fix security definer view: recreate exam_options_student as SECURITY INVOKER
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student
WITH (security_invoker = true)
AS
SELECT eo.id, eo.question_id, eo.option_text, eo.option_image, eo.created_at
FROM public.exam_options eo
JOIN public.exam_questions eq ON eq.id = eo.question_id
JOIN public.exams e ON e.id = eq.exam_id
WHERE e.status = 'published';

GRANT SELECT ON public.exam_options_student TO authenticated;

-- 2. Add missing SELECT policy for school_sms_config
CREATE POLICY "School admins view sms config"
ON public.school_sms_config
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM schools
  WHERE schools.id = school_sms_config.school_id
    AND schools.admin_id = auth.uid()
));

-- 3. Fix overly broad student exam_questions policy
DROP POLICY IF EXISTS "Students view exam_questions" ON public.exam_questions;

CREATE POLICY "Students view published exam_questions"
ON public.exam_questions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM exams e
  JOIN profiles p ON p.school_id = e.school_id
  WHERE e.id = exam_questions.exam_id
    AND p.user_id = auth.uid()
    AND e.status = 'published'
));
