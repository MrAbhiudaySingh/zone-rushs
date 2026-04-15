
-- Drop geo_point column so we can move postgis
ALTER TABLE public.zones DROP COLUMN IF EXISTS geo_point;

-- Move PostGIS to extensions schema
DROP EXTENSION IF EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Fix overly permissive zone update policy
DROP POLICY IF EXISTS "Authenticated users can update zones" ON public.zones;
CREATE POLICY "Clan members can update zones during capture" ON public.zones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.user_id = auth.uid())
  );

-- Fix overly permissive clan creation policy  
DROP POLICY IF EXISTS "Authenticated users can create clans" ON public.clans;
CREATE POLICY "Users can create clans as leader" ON public.clans
  FOR INSERT TO authenticated
  WITH CHECK (leader_id = auth.uid());
