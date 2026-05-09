-- Nightly quest reset: delete completed/claimed quest_progress rows so users get fresh quests
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.reset_quest_progress(_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quest_progress qp
  USING public.quest_definitions qd
  WHERE qp.quest_definition_id = qd.id
    AND qd.tier = _tier;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_quest_progress(text) FROM anon, authenticated;

-- Unschedule any prior versions (safe if none exist)
DO $$
BEGIN
  PERFORM cron.unschedule('zr_reset_daily_quests');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('zr_reset_weekly_quests');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('zr_reset_monthly_quests');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Daily at 00:00 UTC
SELECT cron.schedule(
  'zr_reset_daily_quests',
  '0 0 * * *',
  $$ SELECT public.reset_quest_progress('daily'); $$
);

-- Weekly Monday 00:00 UTC
SELECT cron.schedule(
  'zr_reset_weekly_quests',
  '0 0 * * 1',
  $$ SELECT public.reset_quest_progress('weekly'); $$
);

-- Monthly 1st 00:00 UTC
SELECT cron.schedule(
  'zr_reset_monthly_quests',
  '0 0 1 * *',
  $$ SELECT public.reset_quest_progress('monthly'); $$
);