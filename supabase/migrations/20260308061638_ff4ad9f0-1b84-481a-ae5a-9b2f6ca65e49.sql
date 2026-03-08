
-- RLS for teachers to view their own assignments
CREATE POLICY "Teachers view own assignments"
ON public.teacher_assignments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = teacher_assignments.teacher_id AND teachers.user_id = auth.uid()));

-- Teachers view own school fee_types (for reference)
CREATE POLICY "Teachers view own school fee_types"
ON public.fee_types FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = fee_types.school_id AND teachers.user_id = auth.uid()));

-- Students view own student record
CREATE POLICY "Students view own student record"
ON public.students FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Teachers view own school class_subjects
CREATE POLICY "Teachers view own school class_subjects"
ON public.class_subjects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = class_subjects.school_id AND teachers.user_id = auth.uid()));
