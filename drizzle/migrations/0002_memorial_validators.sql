ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.memorial_validators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  otp_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  confirmed_deceased boolean NOT NULL DEFAULT false,
  confirmed_good_faith boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS memorial_validators_memorial_phone_key
  ON public.memorial_validators (memorial_id, phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorial_validators TO authenticated;
GRANT ALL ON public.memorial_validators TO service_role;

ALTER TABLE public.memorial_validators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memorial admins manage validators"
ON public.memorial_validators FOR ALL TO authenticated
USING (public.is_memorial_admin(memorial_id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.is_memorial_admin(memorial_id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role));