DROP POLICY IF EXISTS "auth users add memories" ON public.memories;
CREATE POLICY "auth users add memories" ON public.memories FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    status = 'pending'
    OR public.is_memorial_admin(memorial_id, auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "owner or admin update" ON public.memories;
CREATE POLICY "owner or admin update" ON public.memories FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_memorial_admin(memorial_id, auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.is_memorial_admin(memorial_id, auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR (auth.uid() = user_id AND status = 'pending')
);

DROP POLICY IF EXISTS "owner or admin delete" ON public.memories;
CREATE POLICY "owner or admin delete" ON public.memories FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_memorial_admin(memorial_id, auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "super admin views all memorials" ON public.memorials FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "super admin updates any memorial" ON public.memorials FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));