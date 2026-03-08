-- 1. Fix student-documents storage policy: scope to school ownership
DROP POLICY IF EXISTS "School admins read student docs" ON storage.objects;
CREATE POLICY "School-scoped student doc read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (SELECT 1 FROM public.schools
              WHERE schools.id::text = split_part(storage.objects.name, '/', 1)
              AND schools.admin_id = auth.uid())
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

-- 2. Fix exam scoring: restrict student_exam_attempts so students can't UPDATE score
DROP POLICY IF EXISTS "Students manage own attempts" ON public.student_exam_attempts;

CREATE POLICY "Students insert own attempts" ON public.student_exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.students st WHERE st.id = student_exam_attempts.student_id AND st.user_id = auth.uid())
  );

CREATE POLICY "Students view own attempts" ON public.student_exam_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.students st WHERE st.id = student_exam_attempts.student_id AND st.user_id = auth.uid())
  );

-- 3. Fix exam options: create a view that hides is_correct from students
CREATE OR REPLACE VIEW public.exam_options_student
WITH (security_invoker = on) AS
  SELECT id, question_id, option_text, option_image, created_at
  FROM public.exam_options;

-- 4. Create server-side scoring function
CREATE OR REPLACE FUNCTION public.submit_exam(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_exam_id uuid;
  v_total_score numeric := 0;
  v_total_max numeric := 0;
  v_correct int := 0;
  v_total int := 0;
  v_exam record;
  v_answer record;
BEGIN
  -- Get attempt and verify ownership
  SELECT student_id, exam_id INTO v_student_id, v_exam_id
  FROM student_exam_attempts WHERE id = p_attempt_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  
  -- Verify caller owns this attempt
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Check attempt is not already completed
  IF EXISTS (SELECT 1 FROM student_exam_attempts WHERE id = p_attempt_id AND status = 'completed') THEN
    RAISE EXCEPTION 'Exam already submitted';
  END IF;
  
  -- Get exam info
  SELECT * INTO v_exam FROM exams WHERE id = v_exam_id;
  
  -- Score each answer server-side
  FOR v_answer IN
    SELECT sa.id AS answer_id, sa.question_id, sa.selected_option_id, eq.marks
    FROM student_answers sa
    JOIN exam_questions eq ON eq.id = sa.question_id
    WHERE sa.attempt_id = p_attempt_id
  LOOP
    v_total := v_total + 1;
    v_total_max := v_total_max + v_answer.marks;
    
    IF v_answer.selected_option_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM exam_options 
      WHERE id = v_answer.selected_option_id AND is_correct = true
    ) THEN
      v_correct := v_correct + 1;
      v_total_score := v_total_score + v_answer.marks;
      
      UPDATE student_answers SET is_correct = true, marks_awarded = v_answer.marks
      WHERE id = v_answer.answer_id;
    ELSE
      UPDATE student_answers SET is_correct = false, marks_awarded = 0
      WHERE id = v_answer.answer_id;
    END IF;
  END LOOP;
  
  -- Also count total max from all questions (including unanswered)
  SELECT COALESCE(SUM(marks), 0) INTO v_total_max
  FROM exam_questions WHERE exam_id = v_exam_id;
  
  -- Update attempt as completed with server-computed score
  UPDATE student_exam_attempts 
  SET score = v_total_score, status = 'completed', end_time = now()
  WHERE id = p_attempt_id;
  
  -- Insert into exam_marks for unified reporting
  IF v_exam.subject_id IS NOT NULL AND v_exam.class_id IS NOT NULL THEN
    INSERT INTO exam_marks (school_id, exam_id, student_id, subject_id, class_id, marks_obtained, max_marks)
    VALUES (v_exam.school_id, v_exam_id, v_student_id, v_exam.subject_id, v_exam.class_id, v_total_score, v_total_max)
    ON CONFLICT (exam_id, student_id, subject_id) 
    DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, max_marks = EXCLUDED.max_marks;
  END IF;
  
  RETURN jsonb_build_object(
    'score', v_total_score,
    'total_max', v_total_max,
    'correct', v_correct,
    'total', v_total
  );
END;
$$;