-- OncoCare Connect - Add appointments delete policy for patient owner
-- Paste this script into your Supabase project's SQL Editor to grant DELETE access to patients.

CREATE POLICY "Allow appointments delete for owner" ON public.appointments
  FOR DELETE USING (auth.uid() = patient_id);
