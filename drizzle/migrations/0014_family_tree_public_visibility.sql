ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS family_tree_public boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.memorials.family_tree_public IS 'Owner/admin public family-tree visibility toggle; consent and individual profile restrictions still apply.';
CREATE POLICY "authorized administrators update memorial details" ON public.memorials FOR UPDATE TO authenticated USING (public.is_memorial_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.is_memorial_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "designated administrators read memorial details" ON public.memorials FOR SELECT TO authenticated USING (public.is_memorial_admin(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.public_family_members(_memorial_id uuid)
RETURNS TABLE(id uuid, name text, relationship text, photo_url text, display_order integer, is_minor boolean, privacy_mode text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
SELECT f.id,
CASE WHEN f.is_minor OR f.privacy_mode='initials' THEN (SELECT string_agg(upper(left(word,1))||'.','' ORDER BY ord) FROM regexp_split_to_table(trim(f.name),'\s+') WITH ORDINALITY t(word,ord)) ELSE split_part(trim(f.name),' ',1) || coalesce((SELECT ' '||string_agg(upper(left(word,1))||'.','' ORDER BY ord) FROM regexp_split_to_table(trim(f.name),'\s+') WITH ORDINALITY t(word,ord) WHERE ord>1),'') END,
f.relationship, CASE WHEN f.is_minor OR f.privacy_mode='initials' THEN NULL ELSE f.photo_url END,
f.display_order,f.is_minor,f.privacy_mode
FROM public.family_members f JOIN public.memorials m ON m.id=f.memorial_id
WHERE m.id=_memorial_id AND m.is_public AND m.family_tree_public AND m.family_consent_confirmed AND f.consent_confirmed AND f.privacy_mode<>'family';
$function$;
GRANT EXECUTE ON FUNCTION public.public_family_members(uuid) TO anon, authenticated, service_role;