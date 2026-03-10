-- Fix exam-images storage policies: restrict to school staff only
DROP POLICY IF EXISTS "School admins upload exam images" ON storage.objects;
DROP POLICY IF EXISTS "School admins delete exam images" ON storage.objects;

CREATE POLICY "School staff upload exam images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exam-images'
    AND (
      has_role(auth.uid(), 'super_admin')
      OR EXISTS (SELECT 1 FROM public.schools WHERE schools.admin_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.teachers WHERE teachers.user_id = auth.uid())
    )
  );

CREATE POLICY "School staff delete exam images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exam-images'
    AND (
      has_role(auth.uid(), 'super_admin')
      OR EXISTS (SELECT 1 FROM public.schools WHERE schools.admin_id = auth.uid())
      OR (owner = auth.uid() AND EXISTS (SELECT 1 FROM public.teachers WHERE teachers.user_id = auth.uid()))
    )
  );