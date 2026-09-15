ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anniversary_muted boolean NOT NULL DEFAULT false;

CREATE TABLE public.anniversary_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, memorial_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anniversary_reminders TO authenticated;
GRANT ALL ON public.anniversary_reminders TO service_role;

ALTER TABLE public.anniversary_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own anniversary reminders"
ON public.anniversary_reminders FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.donation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL UNIQUE REFERENCES public.donations(id) ON DELETE CASCADE,
  user_id uuid,
  receipt_no text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  fundraiser_title text,
  memorial_name text,
  html text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_donation_receipts_user ON public.donation_receipts(user_id);

GRANT SELECT, INSERT ON public.donation_receipts TO authenticated;
GRANT ALL ON public.donation_receipts TO service_role;

ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners view their receipts"
ON public.donation_receipts FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "owners save their receipts"
ON public.donation_receipts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);