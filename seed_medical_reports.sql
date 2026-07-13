-- OncoCare Connect - Medical Reports Seed Data Script
-- Paste this script into your Supabase project's SQL Editor to insert test reports.

-- IMPORTANT INSTRUCTIONS:
-- 1. Open your Supabase Dashboard and check your 'profiles' or 'auth.users' table to find your registered patient UUID.
-- 2. Replace the placeholder 'YOUR_PATIENT_UUID' in the queries below with your registered patient's actual UUID.
-- 3. Run this script in the Supabase SQL Editor.

-- Insert oncology-related reports linked to doctors and patient
INSERT INTO public.medical_reports (patient_id, doctor_id, report_name, report_type, report_date, status, file_url)
VALUES 
  (
    'YOUR_PATIENT_UUID', 
    (SELECT id FROM public.doctors WHERE full_name = 'Dr. Robert Chen' LIMIT 1), 
    'Complete Blood Count (CBC)', 
    'Hematology', 
    '2026-07-05', 
    'Final', 
    'reports/cbc_july2026.pdf'
  ),
  (
    'YOUR_PATIENT_UUID', 
    (SELECT id FROM public.doctors WHERE full_name = 'Dr. Robert Chen' LIMIT 1), 
    'Comprehensive Metabolic Panel (CMP)', 
    'Biochemistry', 
    '2026-07-05', 
    'Final', 
    'reports/cmp_july2026.pdf'
  ),
  (
    'YOUR_PATIENT_UUID', 
    (SELECT id FROM public.doctors WHERE full_name = 'Dr. Robert Chen' LIMIT 1), 
    'CT Scan - Chest/Abdomen', 
    'Radiology', 
    '2026-06-28', 
    'Final', 
    'reports/ct_chest_june2026.pdf'
  )
ON CONFLICT DO NOTHING;
