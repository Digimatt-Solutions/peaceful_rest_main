
-- Multi-photo memories
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- Facebook-style community posts
ALTER TABLE public.community_posts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_url text;

-- LIKES
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_post_likes TO authenticated;
GRANT SELECT ON public.community_post_likes TO anon;
GRANT ALL ON public.community_post_likes TO service_role;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view likes" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "auth like" ON public.community_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner unlike" ON public.community_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENTS
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_post_comments TO authenticated;
GRANT SELECT ON public.community_post_comments TO anon;
GRANT ALL ON public.community_post_comments TO service_role;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view comments" ON public.community_post_comments FOR SELECT USING (true);
CREATE POLICY "auth comment" ON public.community_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner edits comment" ON public.community_post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner or admin deletes comment" ON public.community_post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Super admin manages user_roles
CREATE POLICY "admins insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Super admin views all profiles
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Super admin deletes any community post
CREATE POLICY "admin delete posts" ON public.community_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
