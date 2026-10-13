ALTER TABLE public.condolence_likes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.condolence_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.condolence_comments ADD COLUMN guest_name text;

GRANT INSERT ON public.condolence_likes TO anon;
GRANT INSERT ON public.condolence_comments TO anon;

CREATE POLICY "guest like" ON public.condolence_likes
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE POLICY "guest comment" ON public.condolence_comments
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);