
-- Enable PostGIS extension for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT 'Player',
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_next integer NOT NULL DEFAULT 1000,
  aether integer NOT NULL DEFAULT 0,
  shards integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  shields integer NOT NULL DEFAULT 0,
  combat_rank text NOT NULL DEFAULT 'Unranked',
  influence_rank text NOT NULL DEFAULT 'Seedling',
  avatar_data_url text,
  avatar_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Clans table
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  tag text UNIQUE NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#00C9B1',
  motto text,
  leader_id uuid,
  aether_treasury integer NOT NULL DEFAULT 0,
  cpr_score numeric(6,2) NOT NULL DEFAULT 0,
  rank integer,
  zones_held integer NOT NULL DEFAULT 0,
  total_members integer NOT NULL DEFAULT 0,
  max_members integer NOT NULL DEFAULT 50,
  last_leader_active_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clans viewable by everyone" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clans" ON public.clans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Leaders can update their clan" ON public.clans FOR UPDATE TO authenticated USING (leader_id = auth.uid());

-- Clan members table
CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  clan_role text NOT NULL DEFAULT 'member' CHECK (clan_role IN ('leader', 'senior', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  contribution_points integer NOT NULL DEFAULT 0,
  UNIQUE(clan_id, user_id)
);

ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clan members viewable by everyone" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leaders can update members" ON public.clan_members FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_members.clan_id AND cm.user_id = auth.uid() AND cm.clan_role = 'leader')
);

-- Zones table
CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_type text NOT NULL DEFAULT 'standard' CHECK (zone_type IN ('standard', 'landmark', 'arena', 'residential')),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geo_polygon jsonb,
  geo_point geography(POINT, 4326),
  tier integer NOT NULL DEFAULT 1,
  owner_clan_id uuid REFERENCES public.clans(id) ON DELETE SET NULL,
  control_strength integer NOT NULL DEFAULT 50,
  development_level integer NOT NULL DEFAULT 0,
  aether_rate_per_hour integer NOT NULL DEFAULT 10,
  contest_status text NOT NULL DEFAULT 'peaceful' CHECK (contest_status IN ('peaceful', 'under_attack', 'in_combat')),
  last_capture_at timestamptz,
  recapture_cooldown_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zones viewable by everyone" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update zones" ON public.zones FOR UPDATE TO authenticated USING (true);

-- Zone captures table
CREATE TABLE public.zone_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  attacking_clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  attacker_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'capturing' CHECK (status IN ('capturing', 'in_combat', 'succeeded', 'failed', 'cancelled')),
  timer_started_at timestamptz NOT NULL DEFAULT now(),
  timer_paused_at timestamptz,
  total_paused_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Captures viewable by everyone" ON public.zone_captures FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create captures" ON public.zone_captures FOR INSERT TO authenticated WITH CHECK (auth.uid() = attacker_user_id);
CREATE POLICY "Attacker can update own capture" ON public.zone_captures FOR UPDATE TO authenticated USING (auth.uid() = attacker_user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON public.clans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
