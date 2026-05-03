-- Allow up to 100MB uploads for study materials (videos/PDFs)
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'study-materials';
-- Allow 20MB for student-documents (used for backup ZIP staging too)
UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'student-documents';