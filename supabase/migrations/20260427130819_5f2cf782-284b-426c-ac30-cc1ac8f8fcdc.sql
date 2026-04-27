-- Replace handle_new_user to assign role based on signup metadata, with first-user = super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_first boolean;
  _requested text;
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;
  _requested := COALESCE(NEW.raw_user_meta_data->>'role', 'mourner');

  IF _is_first THEN
    _role := 'super_admin'::public.app_role;
  ELSIF _requested = 'memorial_admin' THEN
    _role := 'memorial_admin'::public.app_role;
  ELSE
    _role := 'mourner'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow super admins to see all roles
DROP POLICY IF EXISTS "super admins view all roles" ON public.user_roles;
CREATE POLICY "super admins view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));