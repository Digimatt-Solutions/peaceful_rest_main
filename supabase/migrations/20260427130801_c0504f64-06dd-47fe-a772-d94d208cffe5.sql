-- Extend app_role enum with super_admin and memorial_admin (mourner is the existing 'user')
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'memorial_admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'memorial_admin';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'mourner') THEN
    ALTER TYPE public.app_role ADD VALUE 'mourner';
  END IF;
END $$;