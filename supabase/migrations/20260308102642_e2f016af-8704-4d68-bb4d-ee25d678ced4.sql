
-- Unlink old teacher user_id for Priya Reddy
UPDATE public.teachers SET user_id = NULL WHERE id = '87a1366a-0ba1-4660-8a60-887960fc5c68';

-- Unlink old profiles for old teacher user
UPDATE public.profiles SET school_id = NULL WHERE user_id = '5ce6f8c3-fcbb-4e3e-8988-8fd5b1e8577e';
DELETE FROM public.user_roles WHERE user_id = '5ce6f8c3-fcbb-4e3e-8988-8fd5b1e8577e';

-- Unlink old student user_id for Ananya Patel  
UPDATE public.students SET user_id = NULL WHERE id = 'cbb0e941-2383-4143-87a5-45af3bc63bb8';
UPDATE public.student_master SET user_id = NULL WHERE id = '46790f2f-7de6-4b77-98e7-5dfff777626b';

-- Unlink old profiles for old student user
UPDATE public.profiles SET school_id = NULL WHERE user_id = 'fa5af9f3-8507-4442-ba07-f39a622733c5';
DELETE FROM public.user_roles WHERE user_id = 'fa5af9f3-8507-4442-ba07-f39a622733c5';
