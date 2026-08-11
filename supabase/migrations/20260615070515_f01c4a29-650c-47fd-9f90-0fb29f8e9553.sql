-- The announcement_participations table was already created
-- by migration 20260430175847_e846729d-0363-4853-9f95-32ab12190071.
-- This migration only ensures the required permissions, RLS,
-- policies, and realtime configuration are present.

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.announcement_participations
TO authenticated;

GRANT SELECT
ON public.announcement_participations
TO anon;

GRANT ALL
ON public.announcement_participations
TO service_role;

ALTER TABLE public.announcement_participations
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view participations"
ON public.announcement_participations;

CREATE POLICY "Anyone can view participations"
ON public.announcement_participations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can add their own participation"
ON public.announcement_participations;

CREATE POLICY "Users can add their own participation"
ON public.announcement_participations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own participation"
ON public.announcement_participations;

CREATE POLICY "Users can remove their own participation"
ON public.announcement_participations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participation"
ON public.announcement_participations;

CREATE POLICY "Users can update their own participation"
ON public.announcement_participations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add the table to realtime only if it is not already present.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'announcement_participations'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.announcement_participations;
    END IF;
END
$$;