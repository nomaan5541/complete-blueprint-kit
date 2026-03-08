
-- Fee Types table (Admission Fee, Tuition Fee, Exam Fee, etc.)
CREATE TABLE public.fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Fee Structures (class-wise fee per academic year)
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  fee_type_id UUID NOT NULL REFERENCES public.fee_types(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, academic_year_id, class_id, fee_type_id)
);

-- Student Fee Payments
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  fee_type_id UUID NOT NULL REFERENCES public.fee_types(id),
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank', 'other')),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id),
  section_id UUID REFERENCES public.sections(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Exams
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'exam',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, academic_year_id, name)
);

-- Exam Marks
CREATE TABLE public.exam_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  marks_obtained NUMERIC,
  max_marks NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

-- Super admin policies
CREATE POLICY "Super admins manage fee_types" ON public.fee_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage fee_structures" ON public.fee_structures FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage fee_payments" ON public.fee_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage attendance" ON public.attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage exams" ON public.exams FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage exam_marks" ON public.exam_marks FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- School admin policies
CREATE POLICY "School admins manage own fee_types" ON public.fee_types FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = fee_types.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own fee_structures" ON public.fee_structures FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = fee_structures.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own fee_payments" ON public.fee_payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = fee_payments.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own attendance" ON public.attendance FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = attendance.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own exams" ON public.exams FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = exams.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own exam_marks" ON public.exam_marks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = exam_marks.school_id AND schools.admin_id = auth.uid()));

-- Teacher policies (can view and mark attendance/marks for their school)
CREATE POLICY "Teachers view own school attendance" ON public.attendance FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = attendance.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = attendance.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers update attendance" ON public.attendance FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = attendance.school_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Teachers view own school exams" ON public.exams FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exams.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school exam_marks" ON public.exam_marks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exam_marks.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers insert exam_marks" ON public.exam_marks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exam_marks.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers update exam_marks" ON public.exam_marks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exam_marks.school_id AND teachers.user_id = auth.uid()));

-- Generate receipt numbers
CREATE SEQUENCE IF NOT EXISTS fee_receipt_seq START 1001;
