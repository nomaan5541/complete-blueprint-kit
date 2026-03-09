
-- Student chat messages table
CREATE TABLE public.student_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_student_chat_student ON public.student_chat_messages(student_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.student_chat_messages ENABLE ROW LEVEL SECURITY;

-- Students can manage their own chat messages
CREATE POLICY "Students manage own chat messages"
ON public.student_chat_messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_chat_messages.student_id
    AND students.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = student_chat_messages.student_id
    AND students.user_id = auth.uid()
  )
);

-- Super admins can view all
CREATE POLICY "Super admins view all chat messages"
ON public.student_chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
