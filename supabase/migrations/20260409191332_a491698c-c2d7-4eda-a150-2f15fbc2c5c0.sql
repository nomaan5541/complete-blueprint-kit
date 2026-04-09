-- Fix study-materials storage: scope upload/delete to teacher's own school path
DROP POLICY IF EXISTS "Teachers upload study materials" ON storage.objects;
CREATE POLICY "Teachers upload study materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND (storage.foldername(name))[1] = teachers.school_id::text
  )
);

DROP POLICY IF EXISTS "Teachers delete study materials" ON storage.objects;
CREATE POLICY "Teachers delete study materials" ON storage.objects
FOR DELETE USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND (storage.foldername(name))[1] = teachers.school_id::text
  )
);