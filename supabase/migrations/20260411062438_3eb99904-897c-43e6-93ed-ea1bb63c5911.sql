-- Fix: Tighten student documents SELECT policy to also check student ID in path
-- and add UPDATE policy for document overwrites

-- Drop and recreate the students read policy with tighter scoping
DROP POLICY IF EXISTS "Students read own documents" ON storage.objects;

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
      AND s.id::text = (storage.foldername(name))[2]
      AND s.status = 'active'
  )
);

-- Add UPDATE policy so admins/teachers can update student documents
CREATE POLICY "School admins update student documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.schools sc
    WHERE sc.admin_id = auth.uid()
      AND sc.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM public.schools sc
    WHERE sc.admin_id = auth.uid()
      AND sc.id::text = (storage.foldername(name))[1]
  )
);