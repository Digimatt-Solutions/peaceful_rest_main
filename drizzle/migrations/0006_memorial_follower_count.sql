CREATE OR REPLACE FUNCTION public.memorial_follower_count(_memorial_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.memorial_followers WHERE memorial_id = _memorial_id
$$;
GRANT EXECUTE ON FUNCTION public.memorial_follower_count(uuid) TO anon, authenticated;
CREATE INDEX IF NOT EXISTS memorial_followers_user_idx ON public.memorial_followers(user_id);
NOTIFY pgrst, 'reload schema';