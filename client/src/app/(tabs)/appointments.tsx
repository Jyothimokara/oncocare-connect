import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { DashboardCard } from '../../components/DashboardCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { AppointmentCard } from '../../components/AppointmentCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchPatientAppointments, cancelAppointment, deleteAppointment, Appointment } from '../../services/appointmentService';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const isDesktop = width >= 768;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeCategory, setActiveCategory] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Action states
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState<Appointment | null>(null);
  const [selectedAppointmentForDelete, setSelectedAppointmentForDelete] = useState<Appointment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchPatientAppointments(user.id);
      setAppointments(data);
    } catch (err: any) {
      console.error('Fetch appointments error:', err);
      let userFriendlyMsg = 'Failed to load appointments. Please try again.';
      const msg = (err?.message || '').toLowerCase();
      const code = String(err?.code || err?.status || '');
      
      if (code === '42501' || msg.includes('permission denied') || msg.includes('policy')) {
        userFriendlyMsg = 'Loading failed. Please contact support if this persists.';
      } else if (msg.includes('jwt') || msg.includes('auth') || msg.includes('session') || code === '401' || code === '403') {
        userFriendlyMsg = 'Your session has expired. Please sign in again.';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('failed to fetch')) {
        userFriendlyMsg = 'Network connection issue. Please check your connection and retry.';
      }
      setErrorMsg(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refetch every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const isAppointmentPast = (dateStr: string, timeStr: string): boolean => {
    try {
      const [timeVal, modifier] = timeStr.split(' ');
      let [hours, minutes] = timeVal.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const [year, month, day] = dateStr.split('-').map(Number);
      const apptDate = new Date(year, month - 1, day, hours, minutes);
      return apptDate.getTime() < Date.now();
    } catch (e) {
      console.warn('Error parsing date/time for comparison:', e);
      const today = new Date().toISOString().split('T')[0];
      return dateStr < today;
    }
  };

  const getFilteredAppointments = () => {
    return appointments.filter((item) => {
      const isPast = isAppointmentPast(item.appointment_date, item.appointment_time);
      if (activeCategory === 'Upcoming') {
        return item.status !== 'Cancelled' && !isPast;
      } else if (activeCategory === 'Past') {
        return item.status !== 'Cancelled' && isPast;
      } else {
        return item.status === 'Cancelled';
      }
    });
  };

  const performCancellation = async () => {
    if (!selectedAppointmentForCancel) return;
    try {
      setIsUpdating(true);
      await cancelAppointment(selectedAppointmentForCancel.id);
      setSelectedAppointmentForCancel(null);
      showToast({ message: 'Appointment cancelled successfully', type: 'success' });
      loadAppointments();
    } catch (err: any) {
      console.error('Cancel appointment card error:', err);
      showToast({ message: 'Failed to cancel appointment. Please try again.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const performDeletion = async () => {
    if (!selectedAppointmentForDelete) return;
    try {
      setIsUpdating(true);
      await deleteAppointment(selectedAppointmentForDelete.id);
      setSelectedAppointmentForDelete(null);
      showToast({ message: 'Appointment deleted successfully', type: 'success' });
      loadAppointments();
    } catch (err: any) {
      console.error('Delete appointment error:', err);
      showToast({ message: 'Failed to delete appointment. Please try again.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderCategoryTabs = () => {
    return (
      <View style={styles.tabContainer}>
        {(['Upcoming', 'Past', 'Cancelled'] as const).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.8}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.tabButton,
                isActive && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading appointments...</Text>
        </View>
      );
    }

    if (errorMsg) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <PrimaryButton
            title="Retry"
            onPress={loadAppointments}
            style={styles.retryBtn}
          />
        </View>
      );
    }

    const filtered = getFilteredAppointments();

    if (filtered.length === 0) {
      let emptyTitle = 'No upcoming appointments';
      let emptySubtitle = 'Schedule a new appointment with your care team.';
      if (activeCategory === 'Past') {
        emptyTitle = 'No past appointments';
        emptySubtitle = 'Your completed appointment history will appear here.';
      } else if (activeCategory === 'Cancelled') {
        emptyTitle = 'No cancelled appointments';
        emptySubtitle = 'Cancelled appointments will appear here.';
      }

      return (
        <View style={styles.stateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          {activeCategory === 'Upcoming' && (
            <PrimaryButton
              title="Schedule New Appointment"
              onPress={() => router.push('/book-appointment')}
              style={styles.bookFirstBtn}
            />
          )}
        </View>
      );
    }

    return (
      <View style={[styles.listContainer, isDesktop && styles.desktopListContainer]}>
        {filtered.map((item) => (
          <AppointmentCard
            key={item.id}
            doctorName={item.doctor?.full_name || 'Oncology Specialist'}
            specialization={item.doctor?.specialization || 'Oncology'}
            dateTime={`${item.appointment_date} at ${item.appointment_time}`}
            location={item.doctor?.department || 'Oncology Wing'}
            status={item.status}
            onPress={() => router.push(`/appointment-details/${item.id}` as any)}
            onReschedule={
              activeCategory === 'Upcoming'
                ? () => router.push(`/reschedule-appointment/${item.id}` as any)
                : undefined
            }
            onCancel={
              activeCategory === 'Upcoming'
                ? () => setSelectedAppointmentForCancel(item)
                : undefined
            }
            onDelete={
              activeCategory !== 'Upcoming'
                ? () => setSelectedAppointmentForDelete(item)
                : undefined
            }
            style={styles.appointmentCard}
          />
        ))}

        {/* Action Button: Styled responsively */}
        <View style={[styles.buttonWrapper, isDesktop && styles.desktopButtonWrapper]}>
          <PrimaryButton
            title="Schedule New Appointment"
            onPress={() => router.push('/book-appointment')}
            style={styles.actionBtn}
          />
        </View>
      </View>
    );
  };

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Appointments" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Professional Header Intro */}
          <DashboardCard style={[styles.introCard, isDesktop && styles.desktopIntroCard]}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Appointment Scheduler</Text>
              <Text style={styles.infoSubtitle}>
                View details of upcoming oncology sessions or schedule a new consultation with your care team.
              </Text>
            </View>
          </DashboardCard>

          {/* Filtering tabs */}
          {renderCategoryTabs()}

          {/* List Title */}
          {appointments.length > 0 && !isLoading && (
            <Text style={styles.sectionHeader}>{activeCategory} Appointments</Text>
          )}

          {renderContent()}
        </View>
      </ScrollView>

      {/* Cancellation confirmation modal */}
      <Modal
        visible={!!selectedAppointmentForCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAppointmentForCancel(null)}
      >
        <View style={styles.modalOverlay}>
          <DashboardCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={28} color={Colors.error} />
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this appointment?
            </Text>

            <View style={styles.modalActions}>
              <SecondaryButton
                title="Keep Appointment"
                onPress={() => setSelectedAppointmentForCancel(null)}
                style={styles.modalButton}
              />
              <PrimaryButton
                title="Cancel Appointment"
                onPress={performCancellation}
                isLoading={isUpdating}
                style={{ flex: 1, backgroundColor: Colors.error }}
              />
            </View>
          </DashboardCard>
        </View>
      </Modal>

      {/* Deletion confirmation modal */}
      <Modal
        visible={!!selectedAppointmentForDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAppointmentForDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <DashboardCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="trash-outline" size={28} color={Colors.error} />
              <Text style={styles.modalTitle}>Delete Appointment</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to permanently delete this appointment from your history? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <SecondaryButton
                title="Keep Appointment"
                onPress={() => setSelectedAppointmentForDelete(null)}
                style={styles.modalButton}
              />
              <PrimaryButton
                title="Delete Permanently"
                onPress={performDeletion}
                isLoading={isUpdating}
                style={{ flex: 1, backgroundColor: Colors.error }}
              />
            </View>
          </DashboardCard>
        </View>
      </Modal>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  contentPadding: {
    padding: Spacing.large,
    width: '100%',
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
  },
  desktopIntroCard: {
    maxWidth: 800,
    alignSelf: 'flex-start',
    width: '100%',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(21, 101, 192, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.body,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: 4,
    marginBottom: Spacing.large,
    gap: 4,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'flex-start',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium as any,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: Typography.weights.bold as any,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  listContainer: {
    width: '100%',
    gap: Spacing.medium,
  },
  desktopListContainer: {
    maxWidth: 800,
    alignSelf: 'flex-start',
  },
  appointmentCard: {
    width: '100%',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: Spacing.large,
  },
  desktopButtonWrapper: {
    alignItems: 'flex-start',
  },
  actionBtn: {
    width: '100%',
    maxWidth: 320,
  },
  stateContainer: {
    padding: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 800,
  },
  stateText: {
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
    marginTop: Spacing.medium,
    marginBottom: Spacing.large,
  },
  retryBtn: {
    minWidth: 120,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    marginBottom: Spacing.xlarge,
    paddingHorizontal: Spacing.medium,
  },
  bookFirstBtn: {
    width: '100%',
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.large,
    gap: Spacing.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  modalMessage: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.body,
    marginVertical: Spacing.small,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.small,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
});
