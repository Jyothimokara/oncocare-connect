-- OncoCare Connect - Doctors Seed Data Script
-- Paste this script into your Supabase project's SQL Editor to insert test oncology specialists.

-- Ensure we insert only if they don't already exist or clean insert
-- Note: id columns use gen_random_uuid() automatically.

INSERT INTO public.doctors (full_name, specialization, qualification, department, availability_status)
VALUES 
  ('Dr. Robert Chen', 'Medical Oncology', 'MD, FACP', 'Oncology Wing, Clinic Room 3B', 'Available'),
  ('Dr. Sarah Jenkins', 'Surgical Oncology', 'MD, FACS', 'Surgical Pavilion, Suite 102', 'Available'),
  ('Dr. Michael Chang', 'Radiation Oncology', 'MD, PhD', 'Radiotherapy Wing, Room A', 'Available'),
  ('Dr. Elena Rostova', 'Gynecologic Oncology', 'MD', 'Women Health Center, Floor 2', 'Available'),
  ('Dr. David Kim', 'Hematology-Oncology', 'MD', 'Blood Disorders Center, Clinic 4D', 'Available')
ON CONFLICT DO NOTHING; -- Safe re-run
