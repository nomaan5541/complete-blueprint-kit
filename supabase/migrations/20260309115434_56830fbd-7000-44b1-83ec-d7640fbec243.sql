-- Fix 1: Update students status check constraint to include transferred and inactive
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check 
  CHECK (status = ANY (ARRAY['active', 'promoted', 'left', 'completed', 'transferred', 'inactive']));

-- Fix 2: Add DELETE RLS policy for teachers on attendance table
CREATE POLICY "Teachers delete attendance"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.school_id = attendance.school_id
      AND teachers.user_id = auth.uid()
  ));