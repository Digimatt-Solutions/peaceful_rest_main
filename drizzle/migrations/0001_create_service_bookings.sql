CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service TEXT NOT NULL DEFAULT 'hardcopy_eulogy',
  design TEXT,
  pages INTEGER,
  quantity INTEGER,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  memorial_name TEXT,
  expected_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.service_bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.service_bookings TO authenticated;
GRANT ALL ON public.service_bookings TO service_role;

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a service booking"
  ON public.service_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users see their own bookings"
  ON public.service_bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage bookings"
  ON public.service_bookings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_service_bookings_created_at ON public.service_bookings (created_at DESC);