-- School-level roles table
CREATE TABLE IF NOT EXISTS public.school_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

ALTER TABLE public.school_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own school_roles"
ON public.school_roles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM schools WHERE schools.id = school_roles.school_id AND schools.admin_id = auth.uid()));

CREATE POLICY "Super admins manage school_roles"
ON public.school_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Auto-seed function: runs on school insert
CREATE OR REPLACE FUNCTION public.seed_school_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cls_names text[] := ARRAY['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
  subj_names text[] := ARRAY['Telugu','Hindi','English','Mathematics','Science','Social Studies'];
  role_names text[] := ARRAY['School Admin','Teacher','Accountant','Exam Coordinator','Attendance Manager'];
  i int;
BEGIN
  -- Seed default classes
  FOR i IN 1..array_length(cls_names, 1) LOOP
    INSERT INTO public.classes (school_id, name, display_order)
    VALUES (NEW.id, cls_names[i], i)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Seed default subjects
  FOREACH i IN ARRAY subj_names LOOP
    NULL; -- handled below
  END LOOP;
  
  FOR i IN 1..array_length(subj_names, 1) LOOP
    INSERT INTO public.subjects (school_id, name, code)
    VALUES (NEW.id, subj_names[i], upper(left(subj_names[i], 3)))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Seed default school roles
  FOR i IN 1..array_length(role_names, 1) LOOP
    INSERT INTO public.school_roles (school_id, name)
    VALUES (NEW.id, role_names[i])
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_seed_school_defaults
AFTER INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.seed_school_defaults();