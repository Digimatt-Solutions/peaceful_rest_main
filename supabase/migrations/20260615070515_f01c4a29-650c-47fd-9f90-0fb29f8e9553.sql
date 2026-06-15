CREATE TABLE public.announcement_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('candle','condolence','donation','rsvp')),
  display_name text NOT NULL,
  avatar_url text,
  message text,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id, action_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_participations TO authenticated;
GRANT SELECT ON public.announcement_participations TO anon;
GRANT ALL ON public.announcement_participations TO service_role;

ALTER TABLE public.announcement_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participations"
  ON public.announcement_participations FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own participation"
  ON public.announcement_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own participation"
  ON public.announcement_participations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.announcement_participations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_participations;