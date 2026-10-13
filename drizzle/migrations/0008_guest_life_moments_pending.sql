ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved', ADD COLUMN IF NOT EXISTS condolence_id uuid REFERENCES public.condolences(id) ON DELETE CASCADE;
GRANT INSERT ON public.memories TO anon;

DROP POLICY IF EXISTS "view memories" ON public.memories;
CREATE POLICY "view memories" ON public.memories FOR SELECT USING (
  status = 'approved' OR auth.uid() = user_id OR public.is_memorial_admin(memorial_id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "anyone adds pending condolence memory" ON public.memories FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND condolence_id IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.sync_condolence_memory_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.memories
  SET status = CASE WHEN NEW.status IN ('approved','pinned') THEN 'approved' ELSE 'pending' END
  WHERE condolence_id = NEW.id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS sync_condolence_memory ON public.condolences;
CREATE TRIGGER sync_condolence_memory AFTER UPDATE OF status ON public.condolences
  FOR EACH ROW EXECUTE FUNCTION public.sync_condolence_memory_status();

CREATE POLICY "guest upload memorial-media" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'memorial-media' AND (storage.foldername(name))[1] = 'guest');