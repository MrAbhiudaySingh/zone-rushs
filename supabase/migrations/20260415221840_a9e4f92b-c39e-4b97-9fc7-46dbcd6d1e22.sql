
-- Quest definitions table
CREATE TABLE public.quest_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'daily' CHECK (tier IN ('daily', 'weekly', 'monthly')),
  category TEXT NOT NULL DEFAULT 'general',
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  aether_reward INTEGER NOT NULL DEFAULT 0,
  shard_reward INTEGER NOT NULL DEFAULT 0,
  tracking_type TEXT NOT NULL DEFAULT 'manual' CHECK (tracking_type IN ('gps', 'photo', 'system', 'manual', 'gps_timer', 'health_api')),
  requires_clan BOOLEAN NOT NULL DEFAULT false,
  icon TEXT DEFAULT '📋',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quest definitions viewable by everyone"
  ON public.quest_definitions FOR SELECT USING (true);

-- Quest progress table
CREATE TABLE public.quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_definition_id UUID NOT NULL REFERENCES public.quest_definitions(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quest progress"
  ON public.quest_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quest progress"
  ON public.quest_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress"
  ON public.quest_progress FOR UPDATE USING (auth.uid() = user_id);

-- Quest proofs table
CREATE TABLE public.quest_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_progress_id UUID NOT NULL REFERENCES public.quest_progress(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL DEFAULT 'photo' CHECK (proof_type IN ('photo', 'screenshot', 'gps_checkin')),
  proof_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quest proofs"
  ON public.quest_proofs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit quest proofs"
  ON public.quest_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for quest proof photos
INSERT INTO storage.buckets (id, name, public) VALUES ('quest-proofs', 'quest-proofs', true);

CREATE POLICY "Users can upload quest proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quest-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Quest proof images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quest-proofs');

-- Triggers for updated_at
CREATE TRIGGER update_quest_definitions_updated_at
  BEFORE UPDATE ON public.quest_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quest_progress_updated_at
  BEFORE UPDATE ON public.quest_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_quest_progress_user_id ON public.quest_progress(user_id);
CREATE INDEX idx_quest_progress_definition ON public.quest_progress(quest_definition_id);
CREATE INDEX idx_quest_proofs_progress ON public.quest_proofs(quest_progress_id);
