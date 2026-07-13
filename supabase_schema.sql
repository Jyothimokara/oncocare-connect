-- OncoCare Connect - PostgreSQL Database Schema Setup
-- Paste this script into your Supabase project's SQL Editor to set up the database.

-- ==========================================
-- 1. CLEANUP (Optional)
-- ==========================================
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop table if exists public.symptoms;
-- drop table if exists public.medical_reports;
-- drop table if exists public.medication_logs;
-- drop table if exists public.medications;
-- drop table if exists public.appointments;
-- drop table if exists public.doctors;
-- drop table if exists public.profiles;

-- ==========================================
-- 2. CREATE SCHEMAS & TABLES
-- ==========================================

-- A. Patient Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- B. Doctors Table
create table public.doctors (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  specialization text not null,
  qualification text,
  department text,
  availability_status text default 'Available' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- C. Appointments Table
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  appointment_date date not null,
  appointment_time text not null, -- formatted as '10:00 AM'
  status text default 'Pending' not null, -- 'Pending', 'Confirmed', 'Cancelled'
  reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- D. Medications Table
create table public.medications (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  medicine_name text not null,
  dosage text not null, -- e.g., '8mg', '4mg'
  frequency text not null, -- e.g., 'Daily', 'Twice a day'
  start_date date not null,
  end_date date,
  instructions text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- E. Medication Logs Table
create table public.medication_logs (
  id uuid default gen_random_uuid() primary key,
  medication_id uuid references public.medications(id) on delete cascade not null,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  scheduled_time text not null, -- e.g., '8:00 AM'
  taken_at timestamptz,
  status text default 'Pending' not null, -- 'Pending', 'Taken', 'Skipped'
  created_at timestamptz default now() not null
);

-- F. Medical Reports Table
create table public.medical_reports (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade,
  report_name text not null,
  report_type text not null, -- e.g., 'Hematology', 'Radiology'
  report_date date not null,
  status text default 'Final' not null, -- 'Final', 'Draft', 'Pending'
  file_url text, -- Mock URL path for Phase 2 demo data
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- G. Symptoms Table
create table public.symptoms (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  symptom_name text not null,
  severity text not null, -- 'Mild', 'Moderate', 'Severe'
  notes text,
  symptom_date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.medical_reports enable row level security;
alter table public.symptoms enable row level security;

-- ==========================================
-- 4. CREATE RLS SECURITY POLICIES
-- ==========================================

-- Profiles: Patients access and edit only their own profile
create policy "Allow profile read for owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Allow profile update for owner" on public.profiles
  for update using (auth.uid() = id);

-- Doctors: Readable by any authenticated application users
create policy "Allow doctors select for authenticated users" on public.doctors
  for select using (auth.role() = 'authenticated');

-- Appointments: Patients read and write only their own appointments
create policy "Allow appointments select for owner" on public.appointments
  for select using (auth.uid() = patient_id);

create policy "Allow appointments insert for owner" on public.appointments
  for insert with check (auth.uid() = patient_id);

create policy "Allow appointments update for owner" on public.appointments
  for update using (auth.uid() = patient_id);

-- Medications: Patients read and write only their own medications
create policy "Allow medications select for owner" on public.medications
  for select using (auth.uid() = patient_id);

create policy "Allow medications insert for owner" on public.medications
  for insert with check (auth.uid() = patient_id);

create policy "Allow medications update for owner" on public.medications
  for update using (auth.uid() = patient_id);

-- Medication Logs: Patients read and write only their own logs
create policy "Allow medication_logs select for owner" on public.medication_logs
  for select using (auth.uid() = patient_id);

create policy "Allow medication_logs insert for owner" on public.medication_logs
  for insert with check (auth.uid() = patient_id);

create policy "Allow medication_logs update for owner" on public.medication_logs
  for update using (auth.uid() = patient_id);

create policy "Allow medication_logs delete for owner" on public.medication_logs
  for delete using (auth.uid() = patient_id);

-- Medical Reports: Patients read only their own reports
create policy "Allow medical_reports select for owner" on public.medical_reports
  for select using (auth.uid() = patient_id);

-- Symptoms: Patients read and write only their own logged symptoms
create policy "Allow symptoms select for owner" on public.symptoms
  for select using (auth.uid() = patient_id);

create policy "Allow symptoms insert for owner" on public.symptoms
  for insert with check (auth.uid() = patient_id);

create policy "Allow symptoms update for owner" on public.symptoms
  for update using (auth.uid() = patient_id);

create policy "Allow symptoms delete for owner" on public.symptoms
  for delete using (auth.uid() = patient_id);

-- ==========================================
-- 5. CREATE FUNCTIONS & TRIGGERS
-- ==========================================

-- A. Auto-update timestamps trigger function
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_modtime before update on public.profiles for each row execute procedure public.update_modified_column();
create trigger update_doctors_modtime before update on public.doctors for each row execute procedure public.update_modified_column();
create trigger update_appointments_modtime before update on public.appointments for each row execute procedure public.update_modified_column();
create trigger update_medications_modtime before update on public.medications for each row execute procedure public.update_modified_column();
create trigger update_medical_reports_modtime before update on public.medical_reports for each row execute procedure public.update_modified_column();
create trigger update_symptoms_modtime before update on public.symptoms for each row execute procedure public.update_modified_column();

-- B. Auto-create user profile row on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    date_of_birth,
    gender
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case 
      when new.raw_user_meta_data->>'date_of_birth' is not null and new.raw_user_meta_data->>'date_of_birth' <> ''
      then (new.raw_user_meta_data->>'date_of_birth')::date 
      else null 
    end,
    coalesce(new.raw_user_meta_data->>'gender', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 6. OPTIMIZATION INDEXES
-- ==========================================
create index if nulls not exists appointments_patient_idx on public.appointments(patient_id);
create index if nulls not exists appointments_doctor_idx on public.appointments(doctor_id);
create index if nulls not exists medications_patient_idx on public.medications(patient_id);
create index if nulls not exists medication_logs_patient_idx on public.medication_logs(patient_id);
create index if nulls not exists medication_logs_medication_idx on public.medication_logs(medication_id);
create index if nulls not exists reports_patient_idx on public.medical_reports(patient_id);
create index if nulls not exists symptoms_patient_idx on public.symptoms(patient_id);

-- ==========================================
-- 7. SEED DEMO DATA
-- ==========================================
-- Seed a default doctor for demonstration purposes
insert into public.doctors (full_name, specialization, qualification, department, availability_status)
values ('Dr. Robert Chen', 'Medical Oncology', 'MD, FACP', 'Oncology Wing', 'Available');
