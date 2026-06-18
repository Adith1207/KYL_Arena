-- Database Migration: Add role column to profiles
-- Date: 2026-06-18
-- Purpose: Support role-based permissions and administration dashboard access.

-- Add the role column to public.profiles if it doesn't already exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'athlete' 
CHECK (role IN ('athlete', 'challenge_admin', 'organization_admin', 'super_admin'));

-- Ensure that users cannot escalate their own role.
-- We do this with a BEFORE UPDATE trigger that checks if the role is being changed.
-- If the role is being changed, we only allow it if the current session user has the 'super_admin' role, or if the trigger is executed outside an authenticated user session (like via service role).
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS trigger AS $$
BEGIN
  -- If the role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if there is an authenticated user session, and if that user is NOT a super_admin
    IF auth.uid() IS NOT NULL THEN
      IF COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'athlete') <> 'super_admin' THEN
        -- Revert the role update to the old value
        NEW.role := OLD.role;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the validation trigger to run before any updates on the profiles table
DROP TRIGGER IF EXISTS tr_check_profile_role_update ON public.profiles;
CREATE TRIGGER tr_check_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_update();

-- Backfill: Make sure existing Adith profile is set to super_admin
-- We identify Adith based on name (containing 'Adith') or email starting with 'adithnarayan.g'
UPDATE public.profiles
SET role = 'super_admin'
WHERE email ILIKE 'adithnarayan.g%' OR name ILIKE '%Adith%';
