-- OncoCare Connect - Secure Role-Based Database Schema Setup (Revised)
-- Paste this script into your Supabase project's SQL Editor to configure columns, RLS updates, and role trigger boundaries.

-- 1. Add role column with a default of 'patient'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'patient';

-- 2. Add CHECK constraint to restrict roles to 'patient' and 'staff'
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_valid_role;

ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_role CHECK (role IN ('patient', 'staff'));

-- 3. Ensure all existing profiles are updated to default 'patient'
UPDATE public.profiles SET role = 'patient' WHERE role IS NULL;

-- 4. Set role column as NOT NULL
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- 5. Restore the standard profiles update policy to avoid recursive RLS/infinite recursion issues
DROP POLICY IF EXISTS "Allow profiles update for owner" ON public.profiles;

CREATE POLICY "Allow profiles update for owner" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 6. Create a context-aware database-level trigger function to block role updates only from client application sessions
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Detect if the update is executed by the 'authenticated' role (App Client/PostgREST session)
  -- If it is, and they try to modify the role column, silently discard the change
  -- This prevents self-promotion while allowing superuser/SQL Editor modifications ('postgres') to succeed
  IF current_setting('role', true) = 'authenticated' AND NEW.role <> OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Bind trigger function to profiles table BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_role_update ON public.profiles;

CREATE TRIGGER trigger_prevent_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_update();
