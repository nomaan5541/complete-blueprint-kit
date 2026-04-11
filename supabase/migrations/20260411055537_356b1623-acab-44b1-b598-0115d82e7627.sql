
-- Allow students to read their own documents from student-documents bucket
CREATE POLICY "Students read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.school_id::text = (storage.foldername(name))[1]
      AND s.status = 'active'
  )
);
