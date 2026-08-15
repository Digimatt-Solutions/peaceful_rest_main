ALTER TABLE public.phone_otps ADD COLUMN IF NOT EXISTS ip text;
CREATE INDEX IF NOT EXISTS phone_otps_ip_created_idx ON public.phone_otps (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS phone_otps_phone_created_idx ON public.phone_otps (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS public.otp_blocks (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  reason text,
  blocked_until timestamptz not null,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.otp_blocks TO service_role;
ALTER TABLE public.otp_blocks ENABLE ROW LEVEL SECURITY;