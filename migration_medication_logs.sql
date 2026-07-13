-- OncoCare Connect - Medication Logs Unique Constraint Migration
-- Paste this script into your Supabase project's SQL Editor to prevent duplicate medication logs.

-- Create a unique expression index that restricts entries to one per medication, per slot time, per date.
CREATE UNIQUE INDEX IF NOT EXISTS unique_medication_log_per_day
ON public.medication_logs (medication_id, scheduled_time, (created_at::date));
