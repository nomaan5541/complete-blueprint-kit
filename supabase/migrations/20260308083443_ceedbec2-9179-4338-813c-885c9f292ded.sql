CREATE TRIGGER on_school_created
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_school_defaults();