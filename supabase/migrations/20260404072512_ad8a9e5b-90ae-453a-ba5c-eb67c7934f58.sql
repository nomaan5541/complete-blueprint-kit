
-- 1. FIX STORAGE POLICIES
DROP POLICY IF EXISTS "School admins upload own logo" ON storage.objects;
CREATE POLICY "School admins upload own logo" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'school-logos' AND
  EXISTS (SELECT 1 FROM schools WHERE schools.id::text = split_part(objects.name, '/', 1) AND schools.admin_id = auth.uid())
);

DROP POLICY IF EXISTS "School admins update own logo" ON storage.objects;
CREATE POLICY "School admins update own logo" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'school-logos' AND
  EXISTS (SELECT 1 FROM schools WHERE schools.id::text = split_part(objects.name, '/', 1) AND schools.admin_id = auth.uid())
);

DROP POLICY IF EXISTS "School admins delete own logo" ON storage.objects;
CREATE POLICY "School admins delete own logo" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'school-logos' AND
  EXISTS (SELECT 1 FROM schools WHERE schools.id::text = split_part(objects.name, '/', 1) AND schools.admin_id = auth.uid())
);

DROP POLICY IF EXISTS "School-scoped student doc upload" ON storage.objects;
CREATE POLICY "School-scoped student doc upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-documents' AND (
    EXISTS (SELECT 1 FROM schools WHERE schools.id::text = split_part(objects.name, '/', 1) AND schools.admin_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "School-scoped student doc delete" ON storage.objects;
CREATE POLICY "School-scoped student doc delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'student-documents' AND (
    EXISTS (SELECT 1 FROM schools WHERE schools.id::text = split_part(objects.name, '/', 1) AND schools.admin_id = auth.uid())
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- 2. REMOVE students/teachers FROM REALTIME
ALTER PUBLICATION supabase_realtime DROP TABLE public.students;
ALTER PUBLICATION supabase_realtime DROP TABLE public.teachers;

-- 3. SMS AUTH KEY PROTECTION
CREATE OR REPLACE VIEW public.school_sms_config_safe
WITH (security_invoker = true)
AS SELECT 
  school_id,
  msg91_sender_id,
  msg91_whatsapp_template_id,
  (msg91_auth_key IS NOT NULL AND msg91_auth_key != '') AS has_auth_key,
  created_at,
  updated_at
FROM public.school_sms_config;

DROP POLICY IF EXISTS "School admins manage own sms config" ON public.school_sms_config;

CREATE POLICY "School admins insert sms config" ON public.school_sms_config
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = school_sms_config.school_id AND schools.admin_id = auth.uid())
);

CREATE POLICY "School admins update sms config" ON public.school_sms_config
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = school_sms_config.school_id AND schools.admin_id = auth.uid())
);

-- 4. EXAM OPTIONS STUDENT VIEW with security_barrier
DROP VIEW IF EXISTS public.exam_options_student;
CREATE VIEW public.exam_options_student
WITH (security_barrier = true, security_invoker = true)
AS SELECT id, question_id, option_text, option_image, created_at
FROM public.exam_options;

-- 5. EXAM ATTEMPT ELIGIBILITY
DROP POLICY IF EXISTS "Students insert exam attempts" ON public.student_exam_attempts;
DROP POLICY IF EXISTS "Students create own attempts" ON public.student_exam_attempts;
CREATE POLICY "Students create own attempts" ON public.student_exam_attempts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students st
    JOIN exams e ON e.school_id = st.school_id
      AND (e.class_id IS NULL OR e.class_id = st.class_id)
      AND (e.section_id IS NULL OR e.section_id = st.section_id)
    WHERE st.id = student_exam_attempts.student_id
      AND st.user_id = auth.uid()
      AND e.id = student_exam_attempts.exam_id
      AND e.status = 'published'
      AND e.exam_mode = 'online'
      AND (e.start_date IS NULL OR e.start_date <= CURRENT_DATE)
      AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE)
  )
);

-- 6. NOTIFICATION TARGETING
DROP POLICY IF EXISTS "Students view own school notifications" ON public.notifications;
CREATE POLICY "Students view own school notifications" ON public.notifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.user_id = auth.uid()
      AND s.school_id = notifications.school_id
      AND s.status = 'active'
      AND (notifications.target_role IS NULL OR notifications.target_role = 'all' OR notifications.target_role = 'student')
      AND (notifications.target_class_id IS NULL OR notifications.target_class_id = s.class_id)
  )
);

DROP POLICY IF EXISTS "Teachers view own school notifications" ON public.notifications;
CREATE POLICY "Teachers view own school notifications" ON public.notifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id = auth.uid()
      AND t.school_id = notifications.school_id
      AND (notifications.target_role IS NULL OR notifications.target_role = 'all' OR notifications.target_role = 'teacher')
  )
);

-- 7. ACADEMIC YEARS STUDENT ACCESS
CREATE POLICY "Students view own school academic_years" ON public.academic_years
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM students s WHERE s.user_id = auth.uid() AND s.school_id = academic_years.school_id AND s.status = 'active')
);

-- 8. EXAM IMAGES PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'exam-images';

DROP POLICY IF EXISTS "Anyone can view exam images" ON storage.objects;
CREATE POLICY "Authenticated view exam images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'exam-images' AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM schools WHERE schools.admin_id = auth.uid())
    OR EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id IS NOT NULL)
  )
);
