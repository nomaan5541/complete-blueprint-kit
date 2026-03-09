
-- Table to store face descriptors for students
CREATE TABLE public.student_face_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  face_descriptor jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.student_face_data ENABLE ROW LEVEL SECURITY;

-- School admins manage face data for their school
CREATE POLICY "School admins manage own face_data"
  ON public.student_face_data FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = student_face_data.school_id AND schools.admin_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM schools WHERE schools.id = student_face_data.school_id AND schools.admin_id = auth.uid()));

-- Teachers can view face data for their school (needed for attendance scanning)
CREATE POLICY "Teachers view school face_data"
  ON public.student_face_data FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = student_face_data.school_id AND teachers.user_id = auth.uid()));

-- Super admins
CREATE POLICY "Super admins manage face_data"
  ON public.student_face_data FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
