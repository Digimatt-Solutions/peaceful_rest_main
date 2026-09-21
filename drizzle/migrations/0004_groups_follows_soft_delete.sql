-- ============ 1. GROUPS ============
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_messages_group_idx ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON public.group_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages TO authenticated;
GRANT ALL ON public.group_messages TO service_role;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin'
  )
$$;

-- The creator is automatically the first admin of the group.
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

DROP TRIGGER IF EXISTS touch_groups ON public.groups;
CREATE TRIGGER touch_groups BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Group directory is browsable so people can join; conversations are not.
CREATE POLICY "Signed in users can browse groups" ON public.groups
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create groups" ON public.groups
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Group admins can update their group" ON public.groups
FOR UPDATE TO authenticated USING (public.is_group_admin(id, auth.uid()));
CREATE POLICY "Group admins can delete their group" ON public.groups
FOR DELETE TO authenticated USING (public.is_group_admin(id, auth.uid()));

CREATE POLICY "Members can see the member list" ON public.group_members
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can join groups" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid() AND role = 'member') OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Own row or admin can update membership" ON public.group_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Leave group or admin removes member" ON public.group_members
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Members can read group messages" ON public.group_messages
FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members can send group messages" ON public.group_messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Senders can edit their own messages" ON public.group_messages
FOR UPDATE TO authenticated USING (sender_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Senders or admins can delete messages" ON public.group_messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- ============ 2. FOLLOW MEMORIALS ============
CREATE TABLE IF NOT EXISTS public.memorial_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (memorial_id, user_id)
);
CREATE INDEX IF NOT EXISTS memorial_followers_user_idx ON public.memorial_followers(user_id);

GRANT SELECT, INSERT, DELETE ON public.memorial_followers TO authenticated;
GRANT ALL ON public.memorial_followers TO service_role;

ALTER TABLE public.memorial_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own follows or memorial admins" ON public.memorial_followers
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_memorial_admin(memorial_id, auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Users can follow memorials" ON public.memorial_followers
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unfollow memorials" ON public.memorial_followers
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ 3. SOFT DELETE / RESTORE (30 DAYS) ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purged_at timestamptz;

CREATE OR REPLACE FUNCTION public.account_deleted_at(_user_id uuid)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT deleted_at FROM public.profiles WHERE id = _user_id
$$;

-- Anonymises accounts whose 30-day restoration window has passed.
-- Activity and audit logs are deliberately left untouched.
CREATE OR REPLACE FUNCTION public.purge_expired_deleted_accounts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer;
BEGIN
  WITH purged AS (
    UPDATE public.profiles
    SET full_name = 'Deleted account', email = NULL, phone = NULL,
        avatar_url = NULL, bio = NULL, purged_at = now()
    WHERE deleted_at IS NOT NULL
      AND purged_at IS NULL
      AND deleted_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO _count FROM purged;
  RETURN _count;
END;
$$;