
-- Add missing columns to exams table
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sections(id),
  ADD COLUMN IF NOT EXISTS exam_date date;

-- Create storage bucket for exam question images
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-images', 'exam-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: school admins can upload
CREATE POLICY "School admins upload exam images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exam-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view exam images" ON storage.objects FOR SELECT
  USING (bucket_id = 'exam-images');

CREATE POLICY "School admins delete exam images" ON storage.objects FOR DELETE
  USING (bucket_id = 'exam-images' AND auth.role() = 'authenticated');
