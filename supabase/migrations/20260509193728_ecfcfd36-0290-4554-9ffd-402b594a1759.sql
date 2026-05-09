
-- New: story_chapters
CREATE TABLE IF NOT EXISTS public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_num int NOT NULL,
  title text NOT NULL,
  subtitle text,
  art_emoji text DEFAULT '📖',
  accent_color text DEFAULT '#0E7C66',
  total_clues int DEFAULT 0,
  clues jsonb DEFAULT '[]'::jsonb,
  summary text,
  status text DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story chapters viewable by everyone"
  ON public.story_chapters FOR SELECT USING (true);
CREATE POLICY "Admins can insert story chapters"
  ON public.story_chapters FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update story chapters"
  ON public.story_chapters FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete story chapters"
  ON public.story_chapters FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_story_chapters_updated_at
  BEFORE UPDATE ON public.story_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clan_id uuid,
  ADD COLUMN IF NOT EXISTS story_clues int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missions_completed int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS influence_points int NOT NULL DEFAULT 0;

-- style_submissions additions
ALTER TABLE public.style_submissions
  ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

-- notifications additions
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_url text;

-- clans additions
ALTER TABLE public.clans
  ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_emoji text DEFAULT '⚔️',
  ADD COLUMN IF NOT EXISTS treasury int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_xp int NOT NULL DEFAULT 0;

-- treasury_log additions (additive, code uses these names)
ALTER TABLE public.treasury_log
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS amount int,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Allow clan members to insert into treasury_log so donate/spend writes succeed
CREATE POLICY "Clan members can insert treasury log"
  ON public.treasury_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = treasury_log.clan_id AND cm.user_id = auth.uid()
  ));

-- proof_submissions additions
ALTER TABLE public.proof_submissions
  ADD COLUMN IF NOT EXISTS reject_reason text;
