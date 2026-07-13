import { supabase } from '../utils/supabase';

export interface Symptom {
  id: string;
  patient_id: string;
  symptom_name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes: string | null;
  symptom_date: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomInput {
  symptom_name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
  symptom_date: string; // format: 'YYYY-MM-DD'
}

/**
 * Fetch symptom history for the logged-in patient
 */
export const fetchPatientSymptoms = async (patientId: string): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('patient_id', patientId)
    .order('symptom_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching symptoms from Supabase:', error.message, error);
    throw error;
  }
  return data || [];
};

/**
 * Log a new symptom for the patient
 */
export const createSymptom = async (
  patientId: string,
  input: SymptomInput
): Promise<Symptom> => {
  const { data, error } = await supabase
    .from('symptoms')
    .insert([
      {
        patient_id: patientId,
        symptom_name: input.symptom_name,
        severity: input.severity,
        notes: input.notes || null,
        symptom_date: input.symptom_date,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting symptom in Supabase:', error.message, error);
    throw error;
  }

  return data;
};

/**
 * Update an existing symptom for the patient
 */
export const updateSymptom = async (
  symptomId: string,
  patientId: string,
  input: SymptomInput
): Promise<Symptom> => {
  const { data, error } = await supabase
    .from('symptoms')
    .update({
      symptom_name: input.symptom_name,
      severity: input.severity,
      notes: input.notes || null,
      symptom_date: input.symptom_date,
    })
    .eq('id', symptomId)
    .eq('patient_id', patientId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating symptom in Supabase:', error.message, error);
    throw error;
  }

  return data;
};

/**
 * Delete a symptom for the patient
 */
export const deleteSymptom = async (
  symptomId: string,
  patientId: string
): Promise<void> => {
  const { error } = await supabase
    .from('symptoms')
    .delete()
    .eq('id', symptomId)
    .eq('patient_id', patientId);

  if (error) {
    console.error('Error deleting symptom from Supabase:', error.message, error);
    throw error;
  }
};
