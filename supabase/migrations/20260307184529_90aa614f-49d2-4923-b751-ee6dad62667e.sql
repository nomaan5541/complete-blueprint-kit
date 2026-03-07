
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student');

-- Create school_status enum
CREATE TYPE public.school_status AS ENUM ('active', 'inactive', 'expired', 'suspended');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  registration_number TEXT,
  status school_status NOT NULL DEFAULT 'active',
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to schools
ALTER TABLE public.profiles ADD CONSTRAINT profiles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 12,
  max_students INTEGER,
  max_teachers INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Payment history table
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT,
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for schools
CREATE POLICY "Super admins can manage all schools" ON public.schools
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can view own school" ON public.schools
  FOR SELECT USING (admin_id = auth.uid());

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone authenticated can view active plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Super admins can manage plans" ON public.subscription_plans
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Super admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = school_id AND schools.admin_id = auth.uid())
  );

-- RLS Policies for payment_history
CREATE POLICY "Super admins can manage all payments" ON public.payment_history
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can view own payments" ON public.payment_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE schools.id = school_id AND schools.admin_id = auth.uid())
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
