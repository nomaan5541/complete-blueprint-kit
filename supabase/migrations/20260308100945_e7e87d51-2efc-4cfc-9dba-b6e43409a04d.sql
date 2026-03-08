-- Add unique constraint for exam_marks upsert (exam + student + subject)
ALTER TABLE public.exam_marks
ADD CONSTRAINT exam_marks_exam_student_subject_unique
UNIQUE (exam_id, student_id, subject_id);