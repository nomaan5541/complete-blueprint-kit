
-- Study materials table
CREATE TABLE public.study_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'notes',
  file_url text,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- RLS: School admins manage
CREATE POLICY "School admins manage study_materials" ON public.study_materials
  FOR ALL USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = study_materials.school_id AND schools.admin_id = auth.uid()));

-- RLS: Super admins
CREATE POLICY "Super admins manage study_materials" ON public.study_materials
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: Teachers manage own materials
CREATE POLICY "Teachers manage own study_materials" ON public.study_materials
  FOR ALL USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = study_materials.teacher_id AND teachers.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = study_materials.teacher_id AND teachers.user_id = auth.uid()));

-- RLS: Students view materials for their class
CREATE POLICY "Students view study_materials" ON public.study_materials
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM students s
    WHERE s.user_id = auth.uid()
      AND s.class_id = study_materials.class_id
      AND s.school_id = study_materials.school_id
      AND s.status = 'active'
  ));

-- Storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true);

-- Storage RLS: Teachers upload
CREATE POLICY "Teachers upload study materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-materials'
    AND EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid())
  );

-- Storage RLS: Teachers delete own
CREATE POLICY "Teachers delete study materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-materials'
    AND EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid())
  );

-- Storage RLS: Authenticated read
CREATE POLICY "Authenticated read study materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'study-materials' AND auth.role() = 'authenticated');
