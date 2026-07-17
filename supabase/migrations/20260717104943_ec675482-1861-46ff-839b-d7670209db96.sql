
CREATE OR REPLACE FUNCTION public.increment_memorial_visitor(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.memorials SET visitor_count = COALESCE(visitor_count, 0) + 1 WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_memorial_visitor(uuid) TO anon, authenticated;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.memorials; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.condolences; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.donations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
