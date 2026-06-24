
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  country text,
  country_code text,
  city text,
  device text,
  browser text,
  os text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a visit"
  ON public.site_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can read visits"
  ON public.site_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE INDEX site_visits_created_at_idx ON public.site_visits (created_at DESC);
CREATE INDEX site_visits_country_idx ON public.site_visits (country);
