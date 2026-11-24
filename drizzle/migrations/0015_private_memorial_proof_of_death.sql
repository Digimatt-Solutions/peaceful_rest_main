CREATE TABLE public.memorial_proof_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_memorial_id uuid NOT NULL,
  memorial_id uuid REFERENCES public.memorials(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('medical_record', 'death_certificate', 'burial_permit')),
  object_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.memorial_proof_documents TO authenticated;
GRANT ALL ON public.memorial_proof_documents TO service_role;
ALTER TABLE public.memorial_proof_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "administrators read memorial proof" ON public.memorial_proof_documents FOR SELECT TO authenticated
USING (memorial_id IS NOT NULL AND (public.is_memorial_admin(memorial_id, auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "creators stage their own memorial proof" ON public.memorial_proof_documents FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() AND memorial_id IS NULL AND object_path LIKE auth.uid()::text || '/' || draft_memorial_id::text || '/%'
AND NOT EXISTS (SELECT 1 FROM public.memorials m WHERE m.id = draft_memorial_id));
CREATE INDEX memorial_proof_documents_memorial_idx ON public.memorial_proof_documents(memorial_id);
CREATE INDEX memorial_proof_documents_draft_idx ON public.memorial_proof_documents(draft_memorial_id, uploaded_by);

CREATE OR REPLACE FUNCTION public.validate_memorial_proof_document() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _object storage.objects%ROWTYPE; _extension text;
BEGIN
  IF NEW.memorial_id IS NOT NULL THEN RAISE EXCEPTION 'Verification documents must be attached during memorial creation'; END IF;
  IF auth.uid() IS NOT NULL AND NEW.uploaded_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'You can only upload your own verification documents'; END IF;
  _extension := CASE NEW.mime_type WHEN 'application/pdf' THEN 'pdf' WHEN 'image/jpeg' THEN 'jpg' WHEN 'image/png' THEN 'png' END;
  IF NEW.object_path IS DISTINCT FROM NEW.uploaded_by::text || '/' || NEW.draft_memorial_id::text || '/' || NEW.id::text || '.' || _extension THEN
    RAISE EXCEPTION 'Invalid verification document path';
  END IF;
  SELECT * INTO _object FROM storage.objects WHERE bucket_id = 'memorial-verification' AND name = NEW.object_path;
  IF NOT FOUND OR _object.metadata->>'mimetype' IS DISTINCT FROM NEW.mime_type OR (_object.metadata->>'size')::bigint IS DISTINCT FROM NEW.file_size THEN
    RAISE EXCEPTION 'Upload a valid PDF, JPG or PNG verification document before saving';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER validate_memorial_proof_document BEFORE INSERT ON public.memorial_proof_documents FOR EACH ROW EXECUTE FUNCTION public.validate_memorial_proof_document();

CREATE OR REPLACE FUNCTION public.require_memorial_proof_of_death() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memorial_proof_documents d JOIN storage.objects o ON o.bucket_id = 'memorial-verification' AND o.name = d.object_path
    WHERE d.draft_memorial_id = NEW.id AND d.memorial_id IS NULL AND d.uploaded_by = NEW.created_by
  ) THEN RAISE EXCEPTION 'Upload at least one proof-of-death document before creating this memorial'; END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER require_memorial_proof_of_death BEFORE INSERT ON public.memorials FOR EACH ROW EXECUTE FUNCTION public.require_memorial_proof_of_death();
CREATE OR REPLACE FUNCTION public.attach_memorial_proof_of_death() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  UPDATE public.memorial_proof_documents SET memorial_id = NEW.id WHERE draft_memorial_id = NEW.id AND memorial_id IS NULL AND uploaded_by = NEW.created_by;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER attach_memorial_proof_of_death AFTER INSERT ON public.memorials FOR EACH ROW EXECUTE FUNCTION public.attach_memorial_proof_of_death();
REVOKE ALL ON FUNCTION public.validate_memorial_proof_document(), public.require_memorial_proof_of_death(), public.attach_memorial_proof_of_death() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_memorial_proof_document(), public.require_memorial_proof_of_death(), public.attach_memorial_proof_of_death() TO service_role;

CREATE POLICY "creators upload private memorial proof" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'memorial-verification' AND (storage.foldername(name))[1] = auth.uid()::text AND array_length(storage.foldername(name), 1) = 2);
CREATE POLICY "administrators read private memorial proof" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'memorial-verification' AND EXISTS (SELECT 1 FROM public.memorial_proof_documents d WHERE d.object_path = name AND d.memorial_id IS NOT NULL));
COMMENT ON TABLE public.memorial_proof_documents IS 'Private proof of death. Staged records are linked atomically on new memorial creation. Never query from public memorial profiles.';