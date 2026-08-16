ALTER TABLE public.fundraisers
  ADD COLUMN IF NOT EXISTS organiser_name text,
  ADD COLUMN IF NOT EXISTS organiser_id_number text,
  ADD COLUMN IF NOT EXISTS payout_phone text,
  ADD COLUMN IF NOT EXISTS organiser_relationship text,
  ADD COLUMN IF NOT EXISTS id_photo_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS paid_out_amount numeric NOT NULL DEFAULT 0;

UPDATE public.fundraisers SET status = 'approved', approved_at = now() WHERE status = 'pending';

DROP POLICY IF EXISTS "view fundraisers" ON public.fundraisers;
CREATE POLICY "public view approved fundraisers" ON public.fundraisers
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "organisers view own fundraisers" ON public.fundraisers
  FOR SELECT TO authenticated
  USING (public.is_memorial_admin(memorial_id, auth.uid()));
CREATE POLICY "super admins manage fundraisers" ON public.fundraisers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  phone text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'queued',
  method text NOT NULL DEFAULT 'mpesa_b2c',
  conversation_id text,
  mpesa_receipt text,
  error text,
  requested_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organisers view payouts for their fundraisers" ON public.payouts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = payouts.fundraiser_id
      AND public.is_memorial_admin(f.memorial_id, auth.uid())
  ));

CREATE POLICY "super admins manage payouts" ON public.payouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

GRANT INSERT, UPDATE ON public.payouts TO authenticated;

CREATE TRIGGER touch_payouts BEFORE UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS payouts_fundraiser_idx ON public.payouts(fundraiser_id);