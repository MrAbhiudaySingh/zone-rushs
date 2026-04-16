
CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_hash text NOT NULL,
  mood_score integer NOT NULL,
  free_text text,
  outreach_requested boolean NOT NULL DEFAULT false,
  crisis_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Block all client access
CREATE POLICY "Deny all client reads" ON public.mood_entries FOR SELECT USING (false);
CREATE POLICY "Deny all client inserts" ON public.mood_entries FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all client updates" ON public.mood_entries FOR UPDATE USING (false);
CREATE POLICY "Deny all client deletes" ON public.mood_entries FOR DELETE USING (false);
