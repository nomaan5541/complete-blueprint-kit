
-- Fix 1: Restrict student access to exams to only published ones, scoped via students table
DROP POLICY IF EXISTS "Students view own school exams" ON public.exams;

CREATE POLICY "Students view own school published exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.school_id = exams.school_id
      AND s.status = 'active'
  )
);

-- Fix 2: Allow students to view their own document records
CREATE POLICY "Students view own documents"
ON public.student_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_documents.student_id
      AND s.user_id = auth.uid()
  )
);
