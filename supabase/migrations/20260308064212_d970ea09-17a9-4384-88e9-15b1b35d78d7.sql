
-- Student documents table
CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own student_documents" ON public.student_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = student_documents.school_id AND schools.admin_id = auth.uid())
);
CREATE POLICY "Super admins manage student_documents" ON public.student_documents FOR ALL USING (
  has_role(auth.uid(), 'super_admin')
);

-- School events / calendar table
CREATE TABLE public.school_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own school_events" ON public.school_events FOR ALL USING (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = school_events.school_id AND schools.admin_id = auth.uid())
);
CREATE POLICY "Super admins manage school_events" ON public.school_events FOR ALL USING (
  has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Teachers view own school events" ON public.school_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = school_events.school_id AND teachers.user_id = auth.uid())
);
CREATE POLICY "Students view own school events" ON public.school_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.school_id = school_events.school_id)
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins view own audit_logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = audit_logs.school_id AND schools.admin_id = auth.uid())
);
CREATE POLICY "School admins insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM schools WHERE schools.id = audit_logs.school_id AND schools.admin_id = auth.uid())
);
CREATE POLICY "Teachers insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM teachers WHERE teachers.school_id = audit_logs.school_id AND teachers.user_id = auth.uid())
);
CREATE POLICY "Super admins manage audit_logs" ON public.audit_logs FOR ALL USING (
  has_role(auth.uid(), 'super_admin')
);

-- Storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', false);

CREATE POLICY "School admins upload student docs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'student-documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "School admins read student docs" ON storage.objects FOR SELECT USING (
  bucket_id = 'student-documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "School admins delete student docs" ON storage.objects FOR DELETE USING (
  bucket_id = 'student-documents' AND auth.role() = 'authenticated'
);
