
ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS national_id text;
CREATE UNIQUE INDEX IF NOT EXISTS memorials_national_id_key ON public.memorials (lower(national_id)) WHERE national_id IS NOT NULL AND length(trim(national_id)) > 0;
ALTER TABLE public.fundraisers ADD COLUMN IF NOT EXISTS death_certificate_number text;
