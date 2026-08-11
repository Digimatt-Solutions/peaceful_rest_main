REVOKE EXECUTE ON FUNCTION public.super_admin_exists() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO service_role;