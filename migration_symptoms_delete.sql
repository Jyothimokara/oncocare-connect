-- OncoCare Connect - Add symptoms delete policy for patient owner
-- Paste this script into your Supabase project's SQL Editor to grant DELETE access to patients.

CREATE POLICY "Allow symptoms delete for owner" ON public.symptoms
  FOR DELETE USING (auth.uid() = patient_id);
