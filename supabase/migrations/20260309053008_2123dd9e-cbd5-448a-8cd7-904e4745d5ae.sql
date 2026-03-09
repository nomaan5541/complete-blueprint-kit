
-- Fix 1: Drop the stripe_secret_key_encrypted column to remove plaintext secret storage
ALTER TABLE public.school_payment_config DROP COLUMN IF EXISTS stripe_secret_key_encrypted;

-- Fix 2: Replace overly permissive ALL policy on student_answers with INSERT + SELECT only
DROP POLICY IF EXISTS "Students manage own answers" ON public.student_answers;

CREATE POLICY "Students insert own answers"
  ON public.student_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM student_exam_attempts a
    JOIN students st ON st.id = a.student_id
    WHERE a.id = student_answers.attempt_id AND st.user_id = auth.uid()
  ));

CREATE POLICY "Students view own answers"
  ON public.student_answers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM student_exam_attempts a
    JOIN students st ON st.id = a.student_id
    WHERE a.id = student_answers.attempt_id AND st.user_id = auth.uid()
  ));
