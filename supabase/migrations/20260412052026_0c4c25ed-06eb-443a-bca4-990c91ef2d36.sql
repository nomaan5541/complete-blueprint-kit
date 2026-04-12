
-- Fix 1: Tighten subscription_requests INSERT policy
-- Drop existing anon INSERT policy and replace with authenticated-only + rate limit
DROP POLICY IF EXISTS "Anyone can submit subscription request" ON public.subscription_requests;
DROP POLICY IF EXISTS "Anon users can submit requests" ON public.subscription_requests;

-- Find and drop any INSERT policy on subscription_requests for anon
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'subscription_requests' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscription_requests', pol.policyname);
  END LOOP;
END $$;

-- Recreate INSERT policy: authenticated only, max 1 request per email per day
CREATE POLICY "Authenticated users submit subscription requests"
ON public.subscription_requests
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.subscription_requests sr
    WHERE sr.email = subscription_requests.email
      AND sr.created_at > now() - interval '1 day'
  )
);

-- Fix 2: Add UPDATE policy for study-materials storage bucket
CREATE POLICY "Teachers update study materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid()
      AND t.school_id::text = (storage.foldername(name))[1]
  )
);
