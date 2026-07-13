import { supabase } from '../utils/supabase';
import { Doctor } from './appointmentService';

export interface MedicalReport {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  report_name: string;
  report_type: string;
  report_date: string;
  status: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Doctor; // Joined relation
}

/**
 * Fetch all medical reports belonging to the patient (sorted newest first)
 */
export const fetchPatientReports = async (patientId: string): Promise<MedicalReport[]> => {
  const { data, error } = await supabase
    .from('medical_reports')
    .select('*, doctor:doctors(*)')
    .eq('patient_id', patientId)
    .order('report_date', { ascending: false });

  if (error) {
    console.error('Error fetching medical reports from Supabase:', error.message, error);
    throw error;
  }
  return data || [];
};

/**
 * Fetch a single medical report details by its ID
 */
export const fetchReportById = async (reportId: string): Promise<MedicalReport> => {
  const { data, error } = await supabase
    .from('medical_reports')
    .select('*, doctor:doctors(*)')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error(`Error fetching medical report details (id: ${reportId}) from Supabase:`, error.message, error);
    throw error;
  }
  return data;
};

/**
 * Generates a time-limited signed URL for viewing private diagnostic reports safely
 * @param filePath The file path stored in medical_reports.file_url (e.g. 'reports/cbc_july2026.pdf')
 * @param expiresIn Number of seconds the URL remains valid (defaults to 60s)
 */
export const getSignedUrl = async (filePath: string, expiresIn = 60): Promise<string> => {
  const { data, error } = await supabase
    .storage
    .from('reports') // private bucket name
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating secure signed URL from Supabase Storage:', error.message, error);
    throw error;
  }
  
  if (!data || !data.signedUrl) {
    throw new Error('Supabase Storage returned an empty signed URL payload.');
  }

  return data.signedUrl;
};
