
-- Create student_master table for permanent student data
CREATE TABLE public.student_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  admission_date DATE DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  father_name TEXT,
  mother_name TEXT,
  father_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  photo_url TEXT,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, admission_number)
);

-- Add student_master_id to students table
ALTER TABLE public.students ADD COLUMN student_master_id UUID REFERENCES public.student_master(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.student_master ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_master
CREATE POLICY "School admins manage own student_master"
  ON public.student_master FOR ALL
  USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = student_master.school_id AND schools.admin_id = auth.uid()));

CREATE POLICY "Super admins manage student_master"
  ON public.student_master FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Teachers view own school student_master"
  ON public.student_master FOR SELECT
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = student_master.school_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Students view own master record"
  ON public.student_master FOR SELECT
  USING (user_id = auth.uid());

-- Migrate existing data: create master records from existing students
INSERT INTO public.student_master (school_id, admission_number, admission_date, name, gender, date_of_birth, blood_group, father_name, mother_name, father_phone, address, city, state, pincode, photo_url, user_id, status)
SELECT DISTINCT ON (school_id, admission_number)
  school_id, admission_number, admission_date, name, gender, date_of_birth, blood_group,
  father_name, mother_name, father_phone, address, city, state, pincode, photo_url, user_id, status
FROM public.students
ORDER BY school_id, admission_number, created_at DESC;

-- Link existing students to their master records
UPDATE public.students s
SET student_master_id = sm.id
FROM public.student_master sm
WHERE s.school_id = sm.school_id AND s.admission_number = sm.admission_number;
