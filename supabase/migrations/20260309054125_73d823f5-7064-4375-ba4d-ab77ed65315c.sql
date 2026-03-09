
-- Fix: Allow same admission_number across different academic years
-- Drop the old constraint and create a new one that includes academic_year_id
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_id_admission_number_key;
CREATE UNIQUE INDEX students_school_admission_year_key ON public.students (school_id, admission_number, academic_year_id);
