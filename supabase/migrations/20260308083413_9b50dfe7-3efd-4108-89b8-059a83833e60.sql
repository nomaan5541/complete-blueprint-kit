CREATE OR REPLACE FUNCTION public.seed_school_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cls_names text[] := ARRAY['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
  subj_names text[] := ARRAY['Telugu','Hindi','English','Mathematics','Science','Social Studies'];
  role_names text[] := ARRAY['School Admin','Teacher','Accountant','Exam Coordinator','Attendance Manager'];
  i int;
  subj text;
  rname text;
BEGIN
  -- Seed default classes
  FOR i IN 1..array_length(cls_names, 1) LOOP
    INSERT INTO public.classes (school_id, name, display_order)
    VALUES (NEW.id, cls_names[i], i)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Seed default subjects
  FOREACH subj IN ARRAY subj_names LOOP
    INSERT INTO public.subjects (school_id, name, code)
    VALUES (NEW.id, subj, upper(left(subj, 3)))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Seed default school roles
  FOREACH rname IN ARRAY role_names LOOP
    INSERT INTO public.school_roles (school_id, name)
    VALUES (NEW.id, rname)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;