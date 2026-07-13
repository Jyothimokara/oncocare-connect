import { supabase } from '../utils/supabase';

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string | null;
  department: string | null;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Doctor; // Joined relation
}

export interface AppointmentInput {
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
}

/**
 * Fetch all available doctors from Supabase
 */
export const fetchDoctors = async (): Promise<Doctor[]> => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('availability_status', 'Available')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching doctors from Supabase:', error.message);
    throw error;
  }

  return data || [];
};

/**
 * Fetch appointments belonging to the authenticated patient
 */
export const fetchPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*)')
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('Error fetching patient appointments from Supabase:', error.message);
    throw error;
  }

  return data || [];
};

/**
 * Fetch the next upcoming chronological appointment for the patient
 */
export const fetchNextAppointment = async (patientId: string): Promise<Appointment | null> => {
  const today = new Date().toISOString().split('T')[0];

  // Try to find confirmed upcoming appointments first
  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*)')
    .eq('patient_id', patientId)
    .gte('appointment_date', today)
    .eq('status', 'Confirmed')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching next confirmed appointment:', error.message);
    throw error;
  }

  if (data && data.length > 0) {
    return data[0];
  }

  // Fallback: Check any upcoming status appointments (e.g., Pending)
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*)')
    .eq('patient_id', patientId)
    .gte('appointment_date', today)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1);

  if (fallbackError) {
    console.error('Error fetching next fallback appointment:', fallbackError.message);
    throw fallbackError;
  }

  return fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
};

/**
 * Save a new appointment to Supabase for the authenticated patient
 */
export const createAppointment = async (
  patientId: string,
  input: AppointmentInput
): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([
      {
        patient_id: patientId,
        doctor_id: input.doctor_id,
        appointment_date: input.appointment_date,
        appointment_time: input.appointment_time,
        reason: input.reason || null,
        status: 'Confirmed', // Set standard confirmed status on client booking
      },
    ])
    .select('*, doctor:doctors(*)')
    .single();

  if (error) {
    console.error('Error saving appointment to Supabase:', error.message);
    throw error;
  }

  return data;
};

/**
 * Fetch detailed appointment information by ID
 */
export const fetchAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*)')
    .eq('id', appointmentId)
    .single();

  if (error) {
    console.error('Error fetching appointment by ID:', error.message);
    throw error;
  }
  return data;
};

/**
 * Update/reschedule an existing appointment
 */
export const rescheduleAppointment = async (
  appointmentId: string,
  date: string,
  time: string
): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      appointment_date: date,
      appointment_time: time,
      status: 'Confirmed', // Keeps it active/confirmed after reschedule
    })
    .eq('id', appointmentId)
    .select('*, doctor:doctors(*)')
    .single();

  if (error) {
    console.error('Error updating/rescheduling appointment:', error.message);
    throw error;
  }
  return data;
};

/**
 * Cancel an appointment (marks status as 'Cancelled')
 */
export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'Cancelled',
    })
    .eq('id', appointmentId)
    .select('*, doctor:doctors(*)')
    .single();

  if (error) {
    console.error('Error cancelling appointment:', error.message);
    throw error;
  }
  return data;
};

/**
 * Permanently delete an eligible appointment from history
 */
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    console.error('Error deleting appointment from Supabase:', error.message);
    throw error;
  }
};
