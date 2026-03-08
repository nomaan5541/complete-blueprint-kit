
-- Allow school admins to UPDATE their own school
CREATE POLICY "School admins can update own school"
ON public.schools FOR UPDATE TO authenticated
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());

-- Allow students to view their own attendance
CREATE POLICY "Students view own attendance"
ON public.attendance FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM students WHERE students.id = attendance.student_id AND students.user_id = auth.uid()));

-- Allow students to view their own exam marks
CREATE POLICY "Students view own exam_marks"
ON public.exam_marks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM students WHERE students.id = exam_marks.student_id AND students.user_id = auth.uid()));

-- Allow students to view their own fee payments
CREATE POLICY "Students view own fee_payments"
ON public.fee_payments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM students WHERE students.id = fee_payments.student_id AND students.user_id = auth.uid()));

-- Allow students to view own school classes
CREATE POLICY "Students view own school classes"
ON public.classes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = classes.school_id));

-- Allow students to view own school sections
CREATE POLICY "Students view own school sections"
ON public.sections FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = sections.school_id));

-- Allow students to view own school subjects
CREATE POLICY "Students view own school subjects"
ON public.subjects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = subjects.school_id));

-- Allow students to view exams in their school
CREATE POLICY "Students view own school exams"
ON public.exams FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = exams.school_id));
