
-- 1. Additive columns on existing tables --------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS qr_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS date_start timestamptz,
  ADD COLUMN IF NOT EXISTS date_end   timestamptz;

-- Backfill date_start/date_end from existing starts_at/ends_at if present
UPDATE public.events SET date_start = starts_at WHERE date_start IS NULL AND starts_at IS NOT NULL;
UPDATE public.events SET date_end   = ends_at   WHERE date_end   IS NULL AND ends_at   IS NOT NULL;

ALTER TABLE public.mood_entries
  ADD COLUMN IF NOT EXISTS outreach_contacted_at timestamptz;

-- 2. wellbeing_outreach -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wellbeing_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_entry_id uuid REFERENCES public.mood_entries(id) ON DELETE SET NULL,
  anon_user_hash text,
  contacted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wellbeing_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read wellbeing outreach"
  ON public.wellbeing_outreach FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert wellbeing outreach"
  ON public.wellbeing_outreach FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. event_qr_codes -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('ae','xp','shards','avatar_item','consumable')),
  reward_value_int integer,
  reward_value_text text,
  reward_label text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  max_redemptions integer,
  redeemed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_qr_codes_token ON public.event_qr_codes(token);
ALTER TABLE public.event_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR codes viewable by everyone"
  ON public.event_qr_codes FOR SELECT USING (true);
CREATE POLICY "Admins can insert QR codes"
  ON public.event_qr_codes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update QR codes"
  ON public.event_qr_codes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete QR codes"
  ON public.event_qr_codes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. event_qr_redemptions ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_qr_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.event_qr_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (qr_code_id, user_id)
);
ALTER TABLE public.event_qr_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions"
  ON public.event_qr_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all redemptions"
  ON public.event_qr_redemptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. event_qr_scan_attempts --------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_qr_scan_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid REFERENCES public.event_qr_codes(id) ON DELETE CASCADE,
  user_id uuid,
  attempt_token text,
  outcome text NOT NULL CHECK (outcome IN (
    'success','unknown_token','expired','sold_out',
    'already_redeemed','invalid_token','not_yet_active'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_qr ON public.event_qr_scan_attempts(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_created ON public.event_qr_scan_attempts(created_at DESC);
ALTER TABLE public.event_qr_scan_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read scan attempts"
  ON public.event_qr_scan_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. redeem_event_qr RPC ------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_event_qr(p_token text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr public.event_qr_codes;
  v_now timestamptz := now();
  v_outcome text;
  v_qr_id uuid;
BEGIN
  SELECT * INTO v_qr FROM public.event_qr_codes WHERE token = p_token FOR UPDATE;
  v_qr_id := v_qr.id;

  IF v_qr.id IS NULL THEN
    INSERT INTO public.event_qr_scan_attempts(qr_code_id, user_id, attempt_token, outcome)
      VALUES (NULL, p_user_id, p_token, 'unknown_token');
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_token');
  END IF;

  IF v_qr.valid_from > v_now THEN
    v_outcome := 'not_yet_active';
  ELSIF v_qr.valid_until IS NOT NULL AND v_qr.valid_until < v_now THEN
    v_outcome := 'expired';
  ELSIF v_qr.max_redemptions IS NOT NULL AND v_qr.redeemed_count >= v_qr.max_redemptions THEN
    v_outcome := 'sold_out';
  ELSE
    v_outcome := NULL;
  END IF;

  IF v_outcome IS NOT NULL THEN
    INSERT INTO public.event_qr_scan_attempts(qr_code_id, user_id, attempt_token, outcome)
      VALUES (v_qr_id, p_user_id, p_token, v_outcome);
    RETURN jsonb_build_object('ok', false, 'error', v_outcome);
  END IF;

  BEGIN
    INSERT INTO public.event_qr_redemptions(qr_code_id, user_id) VALUES (v_qr.id, p_user_id);
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.event_qr_scan_attempts(qr_code_id, user_id, attempt_token, outcome)
      VALUES (v_qr_id, p_user_id, p_token, 'already_redeemed');
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END;

  UPDATE public.event_qr_codes SET redeemed_count = redeemed_count + 1 WHERE id = v_qr.id;

  IF v_qr.reward_type = 'xp' THEN
    UPDATE public.profiles SET xp = COALESCE(xp,0) + COALESCE(v_qr.reward_value_int,0) WHERE user_id = p_user_id;
  ELSIF v_qr.reward_type = 'ae' THEN
    UPDATE public.profiles SET aether = COALESCE(aether,0) + COALESCE(v_qr.reward_value_int,0) WHERE user_id = p_user_id;
  ELSIF v_qr.reward_type = 'shards' THEN
    UPDATE public.profiles SET shards = COALESCE(shards,0) + COALESCE(v_qr.reward_value_int,0) WHERE user_id = p_user_id;
  ELSIF v_qr.reward_type IN ('avatar_item','consumable') THEN
    BEGIN
      INSERT INTO public.user_inventory(user_id, item_id)
        VALUES (p_user_id, v_qr.reward_value_text::uuid)
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Item id is not a uuid (string sprite id from constants) — silently
      -- skip inventory insert; reward is still considered redeemed.
      NULL;
    END;
  END IF;

  INSERT INTO public.event_qr_scan_attempts(qr_code_id, user_id, attempt_token, outcome)
    VALUES (v_qr_id, p_user_id, p_token, 'success');

  RETURN jsonb_build_object(
    'ok', true,
    'reward_type', v_qr.reward_type,
    'reward_value_int', v_qr.reward_value_int,
    'reward_value_text', v_qr.reward_value_text,
    'reward_label', v_qr.reward_label
  );
END
$$;
