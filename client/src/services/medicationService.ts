import { supabase } from '../utils/supabase';

export interface Medication {
  id: string;
  patient_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  patient_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: string;
  created_at: string;
}

export interface ScheduledDose {
  id: string; // Dynamic transient key like `medId-time`
  medication_id: string;
  name: string;
  dosage: string;
  scheduled_time: string;
  taken: boolean;
  log_id?: string;
}

/**
 * Fetch all medications belonging to the patient
 */
export const fetchPatientMedications = async (patientId: string): Promise<Medication[]> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('patient_id', patientId);

  if (error) {
    console.error('Error fetching medications from Supabase:', error.message, error);
    throw error;
  }
  return data || [];
};

/**
 * Fetch all medication logs created today for the patient
 */
export const fetchTodayLogs = async (patientId: string): Promise<MedicationLog[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('patient_id', patientId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (error) {
    console.error('Error fetching today\'s logs from Supabase:', error.message, error);
    throw error;
  }
  return data || [];
};

/**
 * Parses medication frequencies into specific time slots
 */
const getSlotsForFrequency = (frequency: string): string[] => {
  const normalized = frequency.toLowerCase();
  if (normalized.includes('twice')) {
    return ['08:00 AM', '08:00 PM'];
  } else if (normalized.includes('three') || normalized.includes('3 times')) {
    return ['08:00 AM', '12:00 PM', '08:00 PM'];
  } else if (normalized.includes('once') || normalized.includes('daily')) {
    return ['09:00 AM'];
  } else {
    // Default fallback to single slot
    return ['09:00 AM'];
  }
};

/**
 * Helper to compare time slots for chronological sorting
 */
const compareTimes = (a: string, b: string): number => {
  const parseTime = (t: string) => {
    const [time, modifier] = t.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  return parseTime(a) - parseTime(b);
};

/**
 * Dynamically resolves the patient's schedule slots for today
 */
export const fetchTodaySchedule = async (patientId: string): Promise<ScheduledDose[]> => {
  const medications = await fetchPatientMedications(patientId);
  const logs = await fetchTodayLogs(patientId);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Filter medications active today based on start and end dates
  const activeMeds = medications.filter((med) => {
    const start = med.start_date;
    const end = med.end_date;
    return todayStr >= start && (end === null || todayStr <= end);
  });

  // 2. Expand medications into individual time slots matching frequency
  const schedule: ScheduledDose[] = [];

  activeMeds.forEach((med) => {
    const times = getSlotsForFrequency(med.frequency);
    times.forEach((time) => {
      // Check if logged as Taken today
      const matchingLog = logs.find(
        (log) =>
          log.medication_id === med.id &&
          log.scheduled_time === time &&
          log.status === 'Taken'
      );

      schedule.push({
        id: `${med.id}-${time}`,
        medication_id: med.id,
        name: med.medicine_name,
        dosage: med.dosage,
        scheduled_time: time,
        taken: !!matchingLog,
        log_id: matchingLog ? matchingLog.id : undefined,
      });
    });
  });

  // 3. Sort slots chronologically
  return schedule.sort((a, b) => compareTimes(a.scheduled_time, b.scheduled_time));
};

/**
 * Save medication log to database as 'Taken' (enforcing client-side duplicate checking)
 */
export const markAsTaken = async (
  patientId: string,
  medicationId: string,
  scheduledTime: string
): Promise<MedicationLog> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Client-side duplicate check before sending insert request
  const { data: existing, error: checkError } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .eq('scheduled_time', scheduledTime)
    .eq('patient_id', patientId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (checkError) {
    console.error('Error verifying duplicate logs in Supabase:', checkError.message, checkError);
    throw checkError;
  }

  if (existing && existing.length > 0) {
    // Return early if a log is already created
    return existing[0];
  }

  // 2. Create the Taken log row
  const { data, error } = await supabase
    .from('medication_logs')
    .insert([
      {
        medication_id: medicationId,
        patient_id: patientId,
        scheduled_time: scheduledTime,
        taken_at: new Date().toISOString(),
        status: 'Taken',
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting medication log in Supabase:', error.message, error);
    throw error;
  }

  return data;
};

/**
 * Undo medication log (delete it from database)
 */
export const undoMarkAsTaken = async (
  patientId: string,
  medicationId: string,
  scheduledTime: string,
  logId?: string
): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let query = supabase.from('medication_logs').delete();

  if (logId) {
    query = query.eq('id', logId);
  } else {
    query = query
      .eq('patient_id', patientId)
      .eq('medication_id', medicationId)
      .eq('scheduled_time', scheduledTime)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('Error undoing medication log in Supabase:', error.message, error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No medication log was deleted. Please check database permissions or row-level security (RLS) delete policies.');
  }
};

/**
 * Fetch a single medication's details by ID
 */
export const fetchMedicationDetails = async (medicationId: string): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', medicationId)
    .single();

  if (error) {
    console.error('Error fetching medication details from Supabase:', error.message);
    throw error;
  }
  return data;
};

/**
 * Add a new medication for the patient
 */
export const addMedication = async (
  patientId: string,
  medicationData: {
    medicine_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date: string | null;
    instructions: string | null;
  }
): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .insert([
      {
        patient_id: patientId,
        ...medicationData,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error adding medication in Supabase:', error.message);
    throw error;
  }
  return data;
};

/**
 * Update an existing medication's details
 */
export const updateMedication = async (
  medicationId: string,
  medicationData: Partial<Omit<Medication, 'id' | 'patient_id' | 'created_at' | 'updated_at'>>
): Promise<Medication> => {
  const { data, error } = await supabase
    .from('medications')
    .update(medicationData)
    .eq('id', medicationId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating medication in Supabase:', error.message);
    throw error;
  }
  return data;
};

/**
 * Permanently delete a medication
 */
export const deleteMedication = async (medicationId: string): Promise<void> => {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', medicationId);

  if (error) {
    console.error('Error deleting medication from Supabase:', error.message);
    throw error;
  }
};

/**
 * Fetch all medication logs (history) for the patient
 */
export const fetchMedicationHistory = async (
  patientId: string
): Promise<(MedicationLog & { medication?: Medication })[]> => {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*, medication:medications(*)')
    .eq('patient_id', patientId)
    .eq('status', 'Taken')
    .order('taken_at', { ascending: false });

  if (error) {
    console.error('Error fetching medication history from Supabase:', error.message);
    throw error;
  }
  return data || [];
};
