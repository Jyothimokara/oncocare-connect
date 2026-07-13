-- OncoCare Connect - Promote Test Staff Account Script (Revised)
-- Paste this script into your Supabase project's SQL Editor to promote a registered user to the staff role.
-- Note: This command executes as the 'postgres' superuser role, which bypasses the 'authenticated' client trigger block.

-- IMPORTANT: 
-- 1. Register a test account normally in your app.
-- 2. Open Supabase Dashboard, look up the profile ID/auth.users ID for that account.
-- 3. Replace 'YOUR_STAFF_USER_UUID' below with that ID and run this script.

UPDATE public.profiles
SET role = 'staff'
WHERE id = 'YOUR_STAFF_USER_UUID';
