
-- 1. Create helper function to check school active status
CREATE OR REPLACE FUNCTION public.is_school_active(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools WHERE id = p_school_id AND status = 'active'
  )
$$;

-- 2. Create trigger function to enforce read-only on inactive schools
CREATE OR REPLACE FUNCTION public.enforce_school_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For DELETE, use OLD; for INSERT/UPDATE, use NEW
  IF TG_OP = 'DELETE' THEN
    IF NOT is_school_active(OLD.school_id) THEN
      RAISE EXCEPTION 'School is suspended or inactive. Write operations are not permitted.';
    END IF;
    RETURN OLD;
  ELSE
    IF NOT is_school_active(NEW.school_id) THEN
      RAISE EXCEPTION 'School is suspended or inactive. Write operations are not permitted.';
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- 3. Apply trigger to sensitive tables
CREATE TRIGGER enforce_active_school_students
  BEFORE INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

CREATE TRIGGER enforce_active_school_attendance
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

CREATE TRIGGER enforce_active_school_exam_marks
  BEFORE INSERT OR UPDATE OR DELETE ON public.exam_marks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

CREATE TRIGGER enforce_active_school_fee_payments
  BEFORE INSERT OR UPDATE OR DELETE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

CREATE TRIGGER enforce_active_school_homework
  BEFORE INSERT OR UPDATE OR DELETE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

CREATE TRIGGER enforce_active_school_exams
  BEFORE INSERT OR UPDATE OR DELETE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.enforce_school_active();

-- 4. Make study-materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'study-materials';
