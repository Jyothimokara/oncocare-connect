-- OncoCare Connect - Add medications delete policy for patient owner
-- Paste this script into your Supabase project's SQL Editor to grant DELETE access to patients.

CREATE POLICY "Allow medications delete for owner" ON public.medications
  FOR DELETE USING (auth.uid() = patient_id);
