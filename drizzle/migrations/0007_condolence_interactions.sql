ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS media_url text, ADD COLUMN IF NOT EXISTS media_type text, ADD COLUMN IF NOT EXISTS media_title text;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

CREATE TABLE IF NOT EXISTS public.condolence_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condolence_id uuid NOT NULL REFERENCES public.condolences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (condolence_id, user_id)
);
GRANT SELECT ON public.condolence_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.condolence_likes TO authenticated;
GRANT ALL ON public.condolence_likes TO service_role;
ALTER TABLE public.condolence_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view condolence likes" ON public.condolence_likes FOR SELECT USING (true);
CREATE POLICY "like as self" ON public.condolence_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unlike own" ON public.condolence_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.condolence_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condolence_id uuid NOT NULL REFERENCES public.condolences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS condolence_comments_cid ON public.condolence_comments(condolence_id);
CREATE INDEX IF NOT EXISTS condolence_likes_cid ON public.condolence_likes(condolence_id);
GRANT SELECT ON public.condolence_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.condolence_comments TO authenticated;
GRANT ALL ON public.condolence_comments TO service_role;
ALTER TABLE public.condolence_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view condolence comments" ON public.condolence_comments FOR SELECT USING (true);
CREATE POLICY "comment as self" ON public.condolence_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own or admin comment" ON public.condolence_comments FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'super_admin') OR EXISTS (
    SELECT 1 FROM public.condolences c WHERE c.id = condolence_id AND public.is_memorial_admin(c.memorial_id, auth.uid())));