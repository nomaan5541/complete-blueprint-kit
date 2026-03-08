
-- Timetable Slots (period definitions per school)
CREATE TABLE public.timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_order INT NOT NULL DEFAULT 0,
  is_break BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, slot_order)
);

-- Timetable Entries (class -> slot -> subject -> teacher per day)
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id),
  slot_id UUID NOT NULL REFERENCES public.timetable_slots(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.teachers(id),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, section_id, slot_id, day_of_week, academic_year_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('exam', 'fee', 'holiday', 'general')),
  target_role TEXT CHECK (target_role IN ('all', 'student', 'teacher')),
  target_class_id UUID REFERENCES public.classes(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grade Systems
CREATE TABLE public.grade_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  min_marks NUMERIC NOT NULL,
  max_marks NUMERIC NOT NULL,
  grade TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- School setup tracking
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_start_time TIME;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_end_time TIME;

-- Enable RLS
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_systems ENABLE ROW LEVEL SECURITY;

-- Super admin policies
CREATE POLICY "Super admins manage timetable_slots" ON public.timetable_slots FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage timetable_entries" ON public.timetable_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage grade_systems" ON public.grade_systems FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- School admin policies
CREATE POLICY "School admins manage own timetable_slots" ON public.timetable_slots FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = timetable_slots.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own timetable_entries" ON public.timetable_entries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = timetable_entries.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own notifications" ON public.notifications FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = notifications.school_id AND schools.admin_id = auth.uid()));
CREATE POLICY "School admins manage own grade_systems" ON public.grade_systems FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = grade_systems.school_id AND schools.admin_id = auth.uid()));

-- Teacher policies
CREATE POLICY "Teachers view own school timetable_slots" ON public.timetable_slots FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = timetable_slots.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school timetable_entries" ON public.timetable_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = timetable_entries.school_id AND teachers.user_id = auth.uid()));
CREATE POLICY "Teachers view own school notifications" ON public.notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = notifications.school_id AND teachers.user_id = auth.uid()));

-- Student policies (via students table linked to user through profiles)
CREATE POLICY "Students view own school timetable_slots" ON public.timetable_slots FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = timetable_slots.school_id));
CREATE POLICY "Students view own school timetable_entries" ON public.timetable_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = timetable_entries.school_id));
CREATE POLICY "Students view own school notifications" ON public.notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = notifications.school_id));
CREATE POLICY "Students view own school grade_systems" ON public.grade_systems FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = grade_systems.school_id));

-- Add student_user_id to students table for portal login
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
