
CREATE TABLE public.google_fit_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  daily_steps INTEGER NOT NULL DEFAULT 0,
  connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.google_fit_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fitness tokens"
  ON public.google_fit_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness tokens"
  ON public.google_fit_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tokens"
  ON public.google_fit_tokens FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_google_fit_tokens_updated_at
  BEFORE UPDATE ON public.google_fit_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
