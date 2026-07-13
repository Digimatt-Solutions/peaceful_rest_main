
-- 1. platform_settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percent numeric(5,2) NOT NULL DEFAULT 5.00 CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read platform settings"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can insert platform settings"
  ON public.platform_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.platform_settings (platform_fee_percent) VALUES (5.00);

-- 2. memorial_bank_accounts
CREATE TABLE public.memorial_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_number text NOT NULL,
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  country text NOT NULL DEFAULT 'KE',
  resolved_account_name text,
  paystack_subaccount_code text,
  paystack_subaccount_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX memorial_bank_accounts_one_active_per_memorial
  ON public.memorial_bank_accounts (memorial_id) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorial_bank_accounts TO authenticated;
GRANT SELECT ON public.memorial_bank_accounts TO anon;
GRANT ALL ON public.memorial_bank_accounts TO service_role;

ALTER TABLE public.memorial_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active bank accounts (for donation routing)"
  ON public.memorial_bank_accounts FOR SELECT
  USING (true);

CREATE POLICY "Memorial admins can insert bank accounts"
  ON public.memorial_bank_accounts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_memorial_admin(memorial_id, auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Memorial admins can update bank accounts"
  ON public.memorial_bank_accounts FOR UPDATE TO authenticated
  USING (
    public.is_memorial_admin(memorial_id, auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    public.is_memorial_admin(memorial_id, auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Memorial admins can delete bank accounts"
  ON public.memorial_bank_accounts FOR DELETE TO authenticated
  USING (
    public.is_memorial_admin(memorial_id, auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE TRIGGER trg_memorial_bank_accounts_updated
  BEFORE UPDATE ON public.memorial_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. fundraisers additions
ALTER TABLE public.fundraisers
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.memorial_bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','closed'));

-- backfill existing fundraisers to draft (missing bank account)
UPDATE public.fundraisers SET status = 'draft' WHERE bank_account_id IS NULL;

-- 4. donations additions (split audit)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS subaccount_amount numeric(12,2);
