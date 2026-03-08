-- Allow public/anon users to view active subscription plans on landing page
DROP POLICY IF EXISTS "Anyone authenticated can view active plans" ON public.subscription_plans;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);