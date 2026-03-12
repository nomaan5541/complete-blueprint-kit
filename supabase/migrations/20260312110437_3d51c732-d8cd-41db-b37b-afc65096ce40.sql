
-- Drop and recreate exam_options_student view as SECURITY INVOKER
DROP VIEW IF EXISTS public.exam_options_student;

CREATE VIEW public.exam_options_student
WITH (security_invoker = true)
AS
SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

-- Add student SELECT policy on exam_options so the SECURITY INVOKER view works
CREATE POLICY "Students view exam_options via school"
ON public.exam_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM exam_questions q
    JOIN exams e ON e.id = q.exam_id
    JOIN profiles p ON p.school_id = e.school_id
    WHERE q.id = exam_options.question_id
      AND p.user_id = auth.uid()
  )
);
