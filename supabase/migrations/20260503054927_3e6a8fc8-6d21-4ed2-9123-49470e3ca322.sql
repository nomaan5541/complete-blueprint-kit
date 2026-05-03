ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Note: status is text with no CHECK constraint, so 'pending_review' is allowed without altering constraints.
-- Allowed values now: draft, pending_review, published, rejected, archived.

-- Restrict teachers from directly publishing: replace teacher UPDATE policy so they can only set
-- status to draft / pending_review (not 'published').
DROP POLICY IF EXISTS "Teachers update own school exams" ON public.exams;

CREATE POLICY "Teachers update own school exams"
ON public.exams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.school_id = exams.school_id AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.school_id = exams.school_id AND t.user_id = auth.uid()
  )
  AND status IN ('draft', 'pending_review')
);