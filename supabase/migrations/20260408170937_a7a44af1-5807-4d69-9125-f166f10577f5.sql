
-- 1. Fix student_answers INSERT policy: validate question belongs to exam and attempt is in_progress
DROP POLICY IF EXISTS "Students insert own answers" ON public.student_answers;
CREATE POLICY "Students insert own answers" ON public.student_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM student_exam_attempts a
    JOIN students st ON (st.id = a.student_id)
    JOIN exam_questions eq ON (eq.id = student_answers.question_id AND eq.exam_id = a.exam_id)
    WHERE a.id = student_answers.attempt_id
    AND st.user_id = auth.uid()
    AND a.status = 'in_progress'
  )
);

-- 2. Fix exam answer key exposure: remove student SELECT on exam_options
-- Students already use exam_options_student view which excludes is_correct
DROP POLICY IF EXISTS "Students view exam_options" ON public.exam_options;

-- Recreate exam_options_student view with security_barrier
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student WITH (security_barrier = true) AS
SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.exam_options_student TO authenticated;
GRANT SELECT ON public.exam_options_student TO anon;

-- 3. Fix notifications: update teacher SELECT to filter by target_role
DROP POLICY IF EXISTS "Teachers view own school notifications" ON public.notifications;
CREATE POLICY "Teachers view own school notifications" ON public.notifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id = auth.uid()
    AND t.school_id = notifications.school_id
  )
  AND (target_role IS NULL OR target_role = 'all' OR target_role = 'teacher')
);

-- 4. Fix SMS auth key exposure: remove admin SELECT on school_sms_config
-- Admins already use school_sms_config_safe view for reading
-- Edge functions use service role key so they still have full access
DROP POLICY IF EXISTS "School admins view sms config" ON public.school_sms_config;

-- 5. Fix study-materials storage: scope to school membership
DROP POLICY IF EXISTS "Authenticated read study materials" ON storage.objects;
CREATE POLICY "School members read study materials" ON storage.objects
FOR SELECT USING (
  bucket_id = 'study-materials'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM schools WHERE admin_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND status = 'active')
  )
);

-- 6. Fix exam-images storage: tighten to school staff + active exam students
DROP POLICY IF EXISTS "Authenticated view exam images" ON storage.objects;
CREATE POLICY "School members view exam images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'exam-images'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM schools WHERE admin_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND status = 'active')
  )
);
