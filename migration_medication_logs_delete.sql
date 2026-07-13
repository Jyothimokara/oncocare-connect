-- OncoCare Connect - Add medication_logs delete policy for patient owner
-- Paste this script into your Supabase project's SQL Editor to grant DELETE access to patients.

CREATE POLICY "Allow medication_logs delete for owner" ON public.medication_logs
  FOR DELETE USING (auth.uid() = patient_id);
