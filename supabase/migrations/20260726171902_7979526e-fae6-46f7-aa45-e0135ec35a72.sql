ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_method text;
COMMENT ON COLUMN public.donations.payment_method IS 'One of: mpesa, paystack, manual';