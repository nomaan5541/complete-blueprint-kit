
-- Homework/Assignments table
CREATE TABLE public.homework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  attachment_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "School admins manage own homework" ON public.homework
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = homework.school_id AND schools.admin_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM schools WHERE schools.id = homework.school_id AND schools.admin_id = auth.uid()));

CREATE POLICY "Super admins manage homework" ON public.homework
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Teachers manage own homework" ON public.homework
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Students view homework for their class" ON public.homework
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students s
    WHERE s.user_id = auth.uid()
    AND s.class_id = homework.class_id
    AND s.school_id = homework.school_id
    AND s.status = 'active'
  ));

-- Add teacher INSERT/UPDATE for exams (so teachers can create exams)
CREATE POLICY "Teachers insert exams" ON public.exams
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exams.school_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Teachers update own school exams" ON public.exams
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exams.school_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Teachers delete own school exams" ON public.exams
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = exams.school_id AND teachers.user_id = auth.uid()));
