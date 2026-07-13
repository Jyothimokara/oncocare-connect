import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { DashboardCard } from '../../components/DashboardCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchAppointmentById, rescheduleAppointment, Appointment } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { Alert } from '../../utils/alert';

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

export default function RescheduleAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Reschedule Form states
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [dateError, setDateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadAppointment = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchAppointmentById(id);
      if (data) {
        setAppointment(data);
        setDate(data.appointment_date);
        setSelectedTime(data.appointment_time);
      } else {
        setErrorMsg('Appointment details could not be found.');
      }
    } catch (err: any) {
      console.error('Fetch appointment for reschedule error:', err);
      setErrorMsg('Failed to load appointment data.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(id ? `/appointment-details/${id}` as any : '/(tabs)/appointments');
    }
  };

  const validateForm = () => {
    setDateError('');
    let isValid = true;

    if (!date.trim()) {
      setDateError('Date is required.');
      isValid = false;
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        setDateError('Use YYYY-MM-DD format (e.g. 2026-07-25).');
        isValid = false;
      } else {
        // Date must not be in the past
        const [year, month, day] = date.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateObj < today) {
          setDateError('Date cannot be in the past.');
          isValid = false;
        }
      }
    }

    if (!selectedTime) {
      showToast({ message: 'Please select an available time slot.', type: 'error' });
      isValid = false;
    }

    return isValid;
  };

  const handleReschedule = async () => {
    if (!validateForm() || !appointment) return;

    try {
      setIsSaving(true);
      await rescheduleAppointment(appointment.id, date, selectedTime);
      showToast({ message: 'Appointment rescheduled successfully', type: 'success' });
      // Go back to the details screen
      handleBack();
    } catch (err: any) {
      console.error('Reschedule query error:', err);
      showToast({ message: err.message || 'Failed to reschedule appointment. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Reschedule Session" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointment info...</Text>
        </View>
      </ResponsiveContainer>
    );
  }

  if (errorMsg || !appointment) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Reschedule Session" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg || 'Failed to retrieve appointment.'}</Text>
          <PrimaryButton title="Go Back" onPress={handleBack} style={styles.backBtn} />
        </View>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Reschedule Session" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          
          <DashboardCard style={styles.formCard}>
            <View style={styles.doctorInfo}>
              <Ionicons name="calendar" size={24} color={Colors.primary} style={styles.doctorIcon} />
              <View>
                <Text style={styles.doctorName}>Dr. {appointment.doctor?.full_name}</Text>
                <Text style={styles.specialty}>{appointment.doctor?.specialization}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <FormInput
              label="Choose New Date"
              placeholder="YYYY-MM-DD (e.g. 2026-07-25)"
              value={date}
              onChangeText={setDate}
              error={dateError}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Choose New Time Slot</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTime(time)}
                    style={[styles.slotBadge, isSelected && styles.slotBadgeActive]}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <PrimaryButton
              title="Confirm Reschedule"
              onPress={handleReschedule}
              isLoading={isSaving}
              style={styles.saveBtn}
            />
          </DashboardCard>

        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: Spacing.large,
    width: '100%',
  },
  desktopContainer: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xlarge,
  },
  loadingText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    textAlign: 'center',
    marginVertical: Spacing.large,
  },
  backBtn: {
    width: 160,
  },
  formCard: {
    padding: Spacing.large,
    width: '100%',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  doctorIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(21, 101, 192, 0.06)',
    textAlign: 'center',
    lineHeight: 44,
  },
  doctorName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  specialty: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.large,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.small,
    marginTop: Spacing.small,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
    marginBottom: Spacing.xlarge,
    width: '100%',
  },
  slotBadge: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
    flexGrow: 1,
  },
  slotBadgeActive: {
    backgroundColor: 'rgba(0, 137, 123, 0.08)',
    borderColor: Colors.secondary,
    borderWidth: 2,
  },
  slotText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  slotTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  saveBtn: {
    width: '100%',
    marginTop: Spacing.medium,
  },
});
