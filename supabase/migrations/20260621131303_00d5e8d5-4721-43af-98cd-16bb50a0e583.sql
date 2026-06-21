ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS donor_email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_donations_fundraiser ON public.donations(fundraiser_id);