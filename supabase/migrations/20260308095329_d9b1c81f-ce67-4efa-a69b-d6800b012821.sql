
-- Add new columns to exams table for online exam support
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS exam_mode text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id),
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id),
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS total_marks numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Create exam_questions table
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  image_url text,
  marks numeric NOT NULL DEFAULT 1,
  order_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create exam_options table
CREATE TABLE public.exam_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_image text,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create student_exam_attempts table
CREATE TABLE public.student_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  start_time timestamptz,
  end_time timestamptz,
  score numeric,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create student_answers table
CREATE TABLE public.student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.exam_options(id),
  is_correct boolean,
  marks_awarded numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add grade and remarks to exam_marks
ALTER TABLE public.exam_marks
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS remarks text;

-- Enable RLS
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- RLS for exam_questions (via exam -> school)
CREATE POLICY "School admins manage exam_questions" ON public.exam_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM exams e JOIN schools s ON s.id = e.school_id WHERE e.id = exam_questions.exam_id AND s.admin_id = auth.uid()));

CREATE POLICY "Super admins manage exam_questions" ON public.exam_questions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Teachers view exam_questions" ON public.exam_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM exams e JOIN teachers t ON t.school_id = e.school_id WHERE e.id = exam_questions.exam_id AND t.user_id = auth.uid()));

CREATE POLICY "Students view exam_questions" ON public.exam_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM exams e JOIN profiles p ON p.school_id = e.school_id WHERE e.id = exam_questions.exam_id AND p.user_id = auth.uid()));

-- RLS for exam_options (via question -> exam -> school)
CREATE POLICY "School admins manage exam_options" ON public.exam_options FOR ALL
  USING (EXISTS (SELECT 1 FROM exam_questions q JOIN exams e ON e.id = q.exam_id JOIN schools s ON s.id = e.school_id WHERE q.id = exam_options.question_id AND s.admin_id = auth.uid()));

CREATE POLICY "Super admins manage exam_options" ON public.exam_options FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Teachers view exam_options" ON public.exam_options FOR SELECT
  USING (EXISTS (SELECT 1 FROM exam_questions q JOIN exams e ON e.id = q.exam_id JOIN teachers t ON t.school_id = e.school_id WHERE q.id = exam_options.question_id AND t.user_id = auth.uid()));

CREATE POLICY "Students view exam_options" ON public.exam_options FOR SELECT
  USING (EXISTS (SELECT 1 FROM exam_questions q JOIN exams e ON e.id = q.exam_id JOIN profiles p ON p.school_id = e.school_id WHERE q.id = exam_options.question_id AND p.user_id = auth.uid()));

-- RLS for student_exam_attempts
CREATE POLICY "School admins manage student_exam_attempts" ON public.student_exam_attempts FOR ALL
  USING (EXISTS (SELECT 1 FROM exams e JOIN schools s ON s.id = e.school_id WHERE e.id = student_exam_attempts.exam_id AND s.admin_id = auth.uid()));

CREATE POLICY "Super admins manage student_exam_attempts" ON public.student_exam_attempts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Students manage own attempts" ON public.student_exam_attempts FOR ALL
  USING (EXISTS (SELECT 1 FROM students st WHERE st.id = student_exam_attempts.student_id AND st.user_id = auth.uid()));

CREATE POLICY "Teachers view student_exam_attempts" ON public.student_exam_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM exams e JOIN teachers t ON t.school_id = e.school_id WHERE e.id = student_exam_attempts.exam_id AND t.user_id = auth.uid()));

-- RLS for student_answers
CREATE POLICY "School admins manage student_answers" ON public.student_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM student_exam_attempts a JOIN exams e ON e.id = a.exam_id JOIN schools s ON s.id = e.school_id WHERE a.id = student_answers.attempt_id AND s.admin_id = auth.uid()));

CREATE POLICY "Super admins manage student_answers" ON public.student_answers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Students manage own answers" ON public.student_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM student_exam_attempts a JOIN students st ON st.id = a.student_id WHERE a.id = student_answers.attempt_id AND st.user_id = auth.uid()));

CREATE POLICY "Teachers view student_answers" ON public.student_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_exam_attempts a JOIN exams e ON e.id = a.exam_id JOIN teachers t ON t.school_id = e.school_id WHERE a.id = student_answers.attempt_id AND t.user_id = auth.uid()));
