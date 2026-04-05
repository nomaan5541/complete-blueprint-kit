-- Fix 1: Allow teachers to INSERT notifications
CREATE POLICY "Teachers insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.school_id = notifications.school_id
      AND teachers.user_id = auth.uid()
  )
);

-- Fix 2: Allow teachers to UPDATE/DELETE their own notifications
CREATE POLICY "Teachers manage own notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.school_id = notifications.school_id
      AND teachers.user_id = auth.uid()
  )
);

-- Fix 3: Update teacher SELECT to see all school notifications (not just teacher-targeted)
DROP POLICY IF EXISTS "Teachers view own school notifications" ON public.notifications;
CREATE POLICY "Teachers view own school notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id = auth.uid()
      AND t.school_id = notifications.school_id
  )
);

-- Fix 4: Drop the unique constraint on exams that prevents same name across classes
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_school_id_academic_year_id_name_key;