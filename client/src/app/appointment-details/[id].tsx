import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { fetchAppointmentById, cancelAppointment, deleteAppointment, Appointment } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal visibility states
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const loadAppointmentDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchAppointmentById(id);
      if (data) {
        setAppointment(data);
      } else {
        setErrorMsg('Appointment not found.');
      }
    } catch (err: any) {
      console.error('Fetch appointment details error:', err);
      setErrorMsg('Failed to load appointment details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadAppointmentDetails();
    }, [loadAppointmentDetails])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/appointments');
    }
  };

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
      const today = new Date().toISOString().split('T')[0];
      return dateStr < today;
    }
  };

  const handleCancelPress = () => {
    setIsCancelModalVisible(true);
  };

  const handleDeletePress = () => {
    setIsDeleteModalVisible(true);
  };

  const performCancellation = async () => {
    if (!appointment) return;
    try {
      setIsUpdating(true);
      await cancelAppointment(appointment.id);
      setIsCancelModalVisible(false);
      showToast({ message: 'Appointment cancelled successfully', type: 'success' });
      router.replace('/(tabs)/appointments');
    } catch (err: any) {
      console.error('Cancel appointment error:', err);
      showToast({ message: 'Failed to cancel appointment. Please try again.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const performDeletion = async () => {
    if (!appointment) return;
    try {
      setIsUpdating(true);
      await deleteAppointment(appointment.id);
      setIsDeleteModalVisible(false);
      showToast({ message: 'Appointment deleted successfully', type: 'success' });
      router.replace('/(tabs)/appointments');
    } catch (err: any) {
      console.error('Delete appointment error:', err);
      showToast({ message: 'Failed to delete appointment. Please try again.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Appointment Details" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </ResponsiveContainer>
    );
  }

  if (errorMsg || !appointment) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Appointment Details" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg || 'Failed to retrieve appointment details.'}</Text>
          <PrimaryButton title="Go Back" onPress={handleBack} style={styles.backBtn} />
        </View>
      </ResponsiveContainer>
    );
  }

  const isPast = isAppointmentPast(appointment.appointment_date, appointment.appointment_time);
  const isCancelled = appointment.status.toLowerCase() === 'cancelled';
  const showActions = !isPast && !isCancelled;

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Appointment Details" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          
          <DashboardCard style={styles.mainCard}>
            {/* Header info */}
            <View style={styles.doctorHeader}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={32} color={Colors.primary} />
              </View>
              <View style={styles.headerMeta}>
                <Text style={styles.doctorName}>Dr. {appointment.doctor?.full_name || 'Specialist'}</Text>
                <Text style={styles.specialty}>{appointment.doctor?.specialization || 'Oncology'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Appointment Details Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{appointment.appointment_date}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Scheduled Time</Text>
                  <Text style={styles.infoValue}>{appointment.appointment_time}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Location / Department</Text>
                  <Text style={styles.infoValue}>{appointment.doctor?.department || 'Oncology Wing'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(appointment.status) + '15' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(appointment.status) }]}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {appointment.reason ? (
              <>
                <View style={styles.divider} />
                <View style={styles.reasonSection}>
                  <Text style={styles.reasonLabel}>Reason for Appointment</Text>
                  <Text style={styles.reasonValue}>{appointment.reason}</Text>
                </View>
              </>
            ) : null}

          </DashboardCard>

          {/* Action buttons based on status rules */}
          {showActions ? (
            <View style={styles.actionsContainer}>
              <PrimaryButton
                title="Reschedule Appointment"
                onPress={() => router.push(`/reschedule-appointment/${appointment.id}` as any)}
                isLoading={isUpdating}
                style={styles.actionButton}
              />
              
              <SecondaryButton
                title="Cancel Appointment"
                onPress={handleCancelPress}
                isLoading={isUpdating}
                style={styles.actionButton}
              />
            </View>
          ) : (
            <View style={styles.pastCancelledActionsContainer}>
              <PrimaryButton
                title="Delete from History"
                onPress={handleDeletePress}
                isLoading={isUpdating}
                style={{ flex: 1, backgroundColor: Colors.error }}
              />
              
              <View style={styles.statusBanner}>
                <Text style={styles.statusBannerText}>
                  {isCancelled
                    ? 'This appointment was cancelled.'
                    : 'This appointment is completed.'}
                </Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Custom cancellation modal overlay */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
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
                onPress={() => setIsCancelModalVisible(false)}
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

      {/* Custom deletion modal overlay */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
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
                onPress={() => setIsDeleteModalVisible(false)}
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
  container: {
    padding: Spacing.large,
    gap: Spacing.large,
    width: '100%',
  },
  desktopContainer: {
    maxWidth: 600,
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
  mainCard: {
    padding: Spacing.large,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(21, 101, 192, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMeta: {
    flex: 1,
  },
  doctorName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  specialty: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.large,
  },
  infoGrid: {
    gap: Spacing.large,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.medium,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(21, 101, 192, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 2,
    color: Colors.text,
    fontWeight: Typography.weights.medium as any,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.small,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
  },
  reasonSection: {
    width: '100%',
  },
  reasonLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.small,
  },
  reasonValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: Typography.lineHeights.body,
    backgroundColor: Colors.background,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsContainer: {
    gap: Spacing.medium,
    width: '100%',
  },
  actionButton: {
    width: '100%',
  },
  pastCancelledActionsContainer: {
    gap: Spacing.medium,
    width: '100%',
  },
  statusBanner: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  statusBannerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
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
