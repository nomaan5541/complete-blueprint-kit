
-- 1. Add teacher SELECT access to student-documents storage
CREATE POLICY "Teachers read student documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND teachers.school_id::text = split_part(objects.name, '/', 1)
  )
);

-- 2. Fix broken study-materials delete policy (references teachers.name instead of objects.name)
DROP POLICY IF EXISTS "Teachers delete study materials" ON storage.objects;
CREATE POLICY "Teachers delete study materials" ON storage.objects
FOR DELETE USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND (storage.foldername(objects.name))[1] = teachers.school_id::text
  )
);
