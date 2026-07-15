-- Revert Paystack split-payment schema back to single-account model.
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS bank_account_id;
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS status;
ALTER TABLE public.donations DROP COLUMN IF EXISTS platform_fee_amount;
ALTER TABLE public.donations DROP COLUMN IF EXISTS subaccount_amount;
DROP TABLE IF EXISTS public.memorial_bank_accounts CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;