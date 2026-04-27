
-- Roles enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Memorials
CREATE TABLE public.memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  date_of_death DATE,
  cover_photo_url TEXT,
  profile_photo_url TEXT,
  biography TEXT,
  burial_details TEXT,
  service_schedule TEXT,
  venue TEXT,
  location TEXT,
  map_url TEXT,
  program_pdf_url TEXT,
  short_tribute TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  visitor_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public memorials viewable by all" ON public.memorials FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "users create memorials" ON public.memorials FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator updates memorial" ON public.memorials FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "creator deletes memorial" ON public.memorials FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Memorial admins (additional)
CREATE TABLE public.memorial_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memorial_id, user_id)
);
ALTER TABLE public.memorial_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_memorial_admin(_memorial_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memorials WHERE id = _memorial_id AND created_by = _user_id
    UNION
    SELECT 1 FROM public.memorial_admins WHERE memorial_id = _memorial_id AND user_id = _user_id
  )
$$;

CREATE POLICY "view memorial admins" ON public.memorial_admins FOR SELECT USING (true);
CREATE POLICY "primary admin manages additional" ON public.memorial_admins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memorials m WHERE m.id = memorial_id AND m.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.memorials m WHERE m.id = memorial_id AND m.created_by = auth.uid()));

-- Condolences
CREATE TABLE public.condolences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  country TEXT,
  relationship TEXT,
  status TEXT NOT NULL DEFAULT 'approved', -- pending, approved, hidden, pinned
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.condolences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view approved condolences" ON public.condolences FOR SELECT USING (status = 'approved' OR status = 'pinned' OR public.is_memorial_admin(memorial_id, auth.uid()));
CREATE POLICY "anyone submit condolence" ON public.condolences FOR INSERT WITH CHECK (true);
CREATE POLICY "admins update condolences" ON public.condolences FOR UPDATE TO authenticated USING (public.is_memorial_admin(memorial_id, auth.uid()));
CREATE POLICY "admins delete condolences" ON public.condolences FOR DELETE TO authenticated USING (public.is_memorial_admin(memorial_id, auth.uid()));

-- Family members
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- father, mother, spouse, child, sibling
  photo_url TEXT,
  notes TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view family members" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "admins manage family" ON public.family_members FOR ALL TO authenticated USING (public.is_memorial_admin(memorial_id, auth.uid())) WITH CHECK (public.is_memorial_admin(memorial_id, auth.uid()));

-- Memories (Life Moments)
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  photo_url TEXT,
  memory_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view memories" ON public.memories FOR SELECT USING (true);
CREATE POLICY "auth users add memories" ON public.memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner or admin update" ON public.memories FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_memorial_admin(memorial_id, auth.uid()));
CREATE POLICY "owner or admin delete" ON public.memories FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_memorial_admin(memorial_id, auth.uid()));

-- Fundraisers
CREATE TABLE public.fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'funeral_expenses',
  goal_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  raised_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view fundraisers" ON public.fundraisers FOR SELECT USING (true);
CREATE POLICY "admins manage fundraisers" ON public.fundraisers FOR ALL TO authenticated USING (public.is_memorial_admin(memorial_id, auth.uid())) WITH CHECK (public.is_memorial_admin(memorial_id, auth.uid()));

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "anyone donates" ON public.donations FOR INSERT WITH CHECK (true);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorials(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  event_date TIMESTAMPTZ,
  venue TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "admins manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (memorial_id IS NULL AND auth.uid() = created_by OR public.is_memorial_admin(memorial_id, auth.uid()))
  WITH CHECK (memorial_id IS NULL AND auth.uid() = created_by OR public.is_memorial_admin(memorial_id, auth.uid()));

-- Anniversaries
CREATE TABLE public.anniversaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  remembrance_date DATE NOT NULL,
  description TEXT,
  rsvp_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anniversaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view anniversaries" ON public.anniversaries FOR SELECT USING (true);
CREATE POLICY "admins manage anniversaries" ON public.anniversaries FOR ALL TO authenticated USING (public.is_memorial_admin(memorial_id, auth.uid())) WITH CHECK (public.is_memorial_admin(memorial_id, auth.uid()));

-- Community posts
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'support', -- support, encouragement, help
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "auth create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner updates posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner deletes posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_memorials BEFORE UPDATE ON public.memorials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for memorial photos
INSERT INTO storage.buckets (id, name, public) VALUES ('memorial-media', 'memorial-media', true) ON CONFLICT DO NOTHING;

CREATE POLICY "public read memorial-media" ON storage.objects FOR SELECT USING (bucket_id = 'memorial-media');
CREATE POLICY "auth upload memorial-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memorial-media');
CREATE POLICY "owner update memorial-media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'memorial-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner delete memorial-media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memorial-media' AND auth.uid()::text = (storage.foldername(name))[1]);
