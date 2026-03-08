
-- Academic Years table
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('active', 'archived', 'not_started')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, name)
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  admission_number TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  photo_url TEXT,
  blood_group TEXT,
  father_name TEXT,
  mother_name TEXT,
  father_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  class_id UUID REFERENCES public.classes(id),
  section_id UUID REFERENCES public.sections(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'left', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, admission_number)
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  email TEXT,
  qualification TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teacher Assignments (teacher -> class -> subject)
CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id, academic_year_id)
);

-- Class-Subject mapping
CREATE TABLE public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- Enable RLS on all tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- RLS: Super admin can manage everything
CREATE POLICY "Super admins manage academic_years" ON public.academic_years FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage classes" ON public.classes FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage sections" ON public.sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage subjects" ON public.subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage students" ON public.students FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage teachers" ON public.teachers FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage teacher_assignments" ON public.teacher_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- RLS: School admins manage their own school data
CREATE POLICY "School admins manage own academic_years" ON public.academic_years FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = academic_years.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own classes" ON public.classes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = classes.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own sections" ON public.sections FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = sections.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own subjects" ON public.subjects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = subjects.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own students" ON public.students FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = students.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own teachers" ON public.teachers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = teachers.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own teacher_assignments" ON public.teacher_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = teacher_assignments.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = class_subjects.school_id AND schools.admin_id = auth.uid()));

-- Teachers can view their own school's data
CREATE POLICY "Teachers view own school academic_years" ON public.academic_years FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = academic_years.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school classes" ON public.classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = classes.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school sections" ON public.sections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = sections.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school subjects" ON public.subjects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = subjects.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school students" ON public.students FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = students.school_id AND teachers.user_id = auth.uid()));

-- Update triggers
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teachers;
