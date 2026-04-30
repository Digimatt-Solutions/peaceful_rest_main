
CREATE TABLE IF NOT EXISTS public.announcement_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('candle','condolence','donation','rsvp')),
  display_name text NOT NULL,
  avatar_url text,
  message text,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_ap_announcement ON public.announcement_participations(announcement_id);
CREATE INDEX IF NOT EXISTS idx_ap_user ON public.announcement_participations(user_id);

ALTER TABLE public.announcement_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view participations"
  ON public.announcement_participations FOR SELECT
  USING (true);

CREATE POLICY "auth users join"
  ON public.announcement_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner removes participation"
  ON public.announcement_participations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "owner updates participation"
  ON public.announcement_participations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow super_admins to update/delete any announcement (so they can edit any post)
CREATE POLICY "super admins manage all announcements update"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "super admins manage all announcements delete"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "super admins view all announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));
