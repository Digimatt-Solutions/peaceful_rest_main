ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS memorial_id uuid REFERENCES public.memorials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fundraiser_id uuid REFERENCES public.fundraisers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_memorial_id_idx ON public.messages(memorial_id);
CREATE INDEX IF NOT EXISTS messages_fundraiser_id_idx ON public.messages(fundraiser_id);

ALTER TABLE public.condolences ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "anyone submit condolence" ON public.condolences;
CREATE POLICY "anyone submit condolence"
ON public.condolences FOR INSERT
TO public
WITH CHECK (
  status = 'pending'
  OR is_memorial_admin(memorial_id, auth.uid())
  OR has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "admins update condolences" ON public.condolences;
CREATE POLICY "admins update condolences"
ON public.condolences FOR UPDATE
TO authenticated
USING (is_memorial_admin(memorial_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "admins delete condolences" ON public.condolences;
CREATE POLICY "admins delete condolences"
ON public.condolences FOR DELETE
TO authenticated
USING (is_memorial_admin(memorial_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "view approved condolences" ON public.condolences;
CREATE POLICY "view approved condolences"
ON public.condolences FOR SELECT
TO public
USING (
  status IN ('approved','pinned')
  OR is_memorial_admin(memorial_id, auth.uid())
  OR has_role(auth.uid(), 'super_admin'::public.app_role)
);