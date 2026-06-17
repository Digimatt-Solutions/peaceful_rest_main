-- Attach handle_new_user trigger so signup metadata role is applied
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow super admins to delete profiles (cascade-clean of related data)
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Prevent deletion of any super_admin role row by anyone
CREATE OR REPLACE FUNCTION public.prevent_super_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'super_admin'::public.app_role THEN
    RAISE EXCEPTION 'Super admin role cannot be removed';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_role ON public.user_roles;
CREATE TRIGGER protect_super_admin_role
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_delete();