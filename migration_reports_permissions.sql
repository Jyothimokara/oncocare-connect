-- OncoCare Connect - Medical Reports Privileges Fix
-- Run this script in the Supabase SQL Editor if SELECT permissions are restricted for patients.

-- Explicitly grant select/read permissions on reports and doctors to the authenticated client role
GRANT SELECT ON public.medical_reports TO authenticated;
GRANT SELECT ON public.doctors TO authenticated;
