
-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'researcher', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix zones UPDATE policy — restrict to active captures only
DROP POLICY IF EXISTS "Clan members can update zones during capture" ON public.zones;

CREATE POLICY "Clan members can update zones during active capture"
  ON public.zones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.zone_captures zc
      JOIN public.clan_members cm ON cm.clan_id = zc.attacking_clan_id
      WHERE zc.zone_id = zones.id
        AND cm.user_id = auth.uid()
        AND zc.status IN ('capturing', 'in_combat')
    )
  );

-- 3. Add DELETE policy on google_fit_tokens
CREATE POLICY "Users can delete own fitness tokens"
  ON public.google_fit_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
