-- OncoCare Connect - Medications Seed Data Script
-- Paste this script into your Supabase project's SQL Editor to insert test medications.

-- IMPORTANT INSTRUCTIONS:
-- 1. Open your Supabase Dashboard and check your 'profiles' or 'auth.users' table to find your registered patient UUID.
-- 2. Replace the placeholder 'YOUR_PATIENT_UUID' in the queries below with your registered patient's actual UUID.
-- 3. Run this script in the Supabase SQL Editor.

-- Insert oncology-related demo medications linked to the patient
INSERT INTO public.medications (patient_id, medicine_name, dosage, frequency, start_date, end_date, instructions)
VALUES 
  ('YOUR_PATIENT_UUID', 'Ondansetron', '8mg', 'Twice daily', '2026-07-01', '2026-08-31', 'Take every 12 hours as needed for nausea prevention. Do not exceed 16mg/day.'),
  ('YOUR_PATIENT_UUID', 'Dexamethasone', '4mg', 'Once daily', '2026-07-01', '2026-07-20', 'Take in the morning with food to prevent sleep disturbances.'),
  ('YOUR_PATIENT_UUID', 'Amlodipine', '5mg', 'Once daily', '2026-07-01', NULL, 'Take daily for blood pressure control.')
ON CONFLICT DO NOTHING;
