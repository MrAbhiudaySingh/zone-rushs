
-- shop_items
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  tier text NOT NULL DEFAULT 'common',
  price_ae integer NOT NULL DEFAULT 0,
  price_shards integer NOT NULL DEFAULT 0,
  soul_bound boolean NOT NULL DEFAULT false,
  tradeable boolean NOT NULL DEFAULT true,
  stock integer,
  svg_asset_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop items viewable by everyone" ON public.shop_items FOR SELECT USING (true);

-- user_inventory
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  equipped boolean NOT NULL DEFAULT false,
  listed_for_sale boolean NOT NULL DEFAULT false,
  sale_price_ae integer,
  den_slot text,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  acquired_via text DEFAULT 'shop'
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON public.user_inventory FOR DELETE USING (auth.uid() = user_id);

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'upcoming',
  starts_at timestamptz,
  ends_at timestamptz,
  reward_ae integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);

-- event_participants
CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event participants viewable by everyone" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Users can join events" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- style_events
CREATE TABLE public.style_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  theme_title text NOT NULL,
  theme_description text,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.style_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Style events viewable by everyone" ON public.style_events FOR SELECT USING (true);

-- style_submissions
CREATE TABLE public.style_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  style_event_id uuid NOT NULL REFERENCES public.style_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  design_png_url text,
  approval_status text NOT NULL DEFAULT 'pending',
  vote_count integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.style_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Style submissions viewable by everyone" ON public.style_submissions FOR SELECT USING (true);
CREATE POLICY "Users can submit styles" ON public.style_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.style_submissions FOR UPDATE USING (auth.uid() = user_id);

-- game_config
CREATE TABLE public.game_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text
);
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game config viewable by everyone" ON public.game_config FOR SELECT USING (true);

-- story_progress
CREATE TABLE public.story_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id text NOT NULL,
  clue_index integer NOT NULL DEFAULT 0,
  completed_at timestamptz
);
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own story progress" ON public.story_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own story progress" ON public.story_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story progress" ON public.story_progress FOR UPDATE USING (auth.uid() = user_id);

-- proof_submissions
CREATE TABLE public.proof_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_progress_id uuid NOT NULL REFERENCES public.quest_progress(id) ON DELETE CASCADE,
  proof_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.proof_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own proof submissions" ON public.proof_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit proofs" ON public.proof_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- treasury_log
CREATE TABLE public.treasury_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  amount_ae integer NOT NULL DEFAULT 0,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treasury_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Treasury log viewable by clan members" ON public.treasury_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = treasury_log.clan_id AND cm.user_id = auth.uid())
);

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
