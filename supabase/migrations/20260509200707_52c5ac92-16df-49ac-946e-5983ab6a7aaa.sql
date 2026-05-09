
-- 1. Remove sensitive mood data from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.mood_entries;

-- 2. Storage: allow users to delete only their own quest-proof files
CREATE POLICY "Users can delete own quest proofs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'quest-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Revoke EXECUTE on internal/trigger SECURITY DEFINER functions from anon and authenticated.
-- These run as triggers / cron jobs and should never be callable from the API.
REVOKE EXECUTE ON FUNCTION public.reset_quest_progress(text)        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_level_up()                  FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM anon, authenticated, public;

-- 4. QR redemption is for signed-in players only
REVOKE EXECUTE ON FUNCTION public.redeem_event_qr(text, uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.redeem_event_qr(text, uuid) TO authenticated;

-- 5. has_role is needed by RLS — keep accessible to authenticated, lock anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
