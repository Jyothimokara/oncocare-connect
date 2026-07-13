import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MedicationCard } from '../../components/MedicationCard';
import { DashboardCard } from '../../components/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Alert } from '../../utils/alert';
import { fetchTodaySchedule, markAsTaken, undoMarkAsTaken, fetchMedicationHistory, ScheduledDose, MedicationLog, Medication } from '../../services/medicationService';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<'Today' | 'History'>('Today');
  const [schedule, setSchedule] = useState<ScheduledDose[]>([]);
  const [history, setHistory] = useState<(MedicationLog & { medication?: Medication })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [processingDoseId, setProcessingDoseId] = useState<string | null>(null);

  const loadTodaySchedule = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchTodaySchedule(user.id);
      setSchedule(data);
    } catch (err: any) {
      setErrorMsg("Failed to load today's medication schedule.");
      console.error('Fetch today schedule error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchMedicationHistory(user.id);
      setHistory(data);
    } catch (err: any) {
      setErrorMsg('Failed to load medication history.');
      console.error('Fetch medication history error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    const [updatedSchedule, updatedHistory] = await Promise.all([
      fetchTodaySchedule(user.id),
      fetchMedicationHistory(user.id)
    ]);
    setSchedule(updatedSchedule);
    setHistory(updatedHistory);
  }, [user]);

  // Refetch when screen gains focus or tab changes
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'Today') {
        loadTodaySchedule();
      } else {
        loadHistory();
      }
    }, [activeTab, loadTodaySchedule, loadHistory])
  );

  const isDoseTimePast = (scheduledTimeStr: string): boolean => {
    try {
      const [timeVal, modifier] = scheduledTimeStr.split(' ');
      let [hours, minutes] = timeVal.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const now = new Date();
      const doseTime = new Date();
      doseTime.setHours(hours, minutes, 0, 0);
      return doseTime.getTime() < now.getTime();
    } catch (e) {
      return false;
    }
  };

  const handleToggleTaken = async (dose: ScheduledDose) => {
    if (!user || processingDoseId) return;

    if (dose.taken) {
      try {
        setProcessingDoseId(dose.id);
        // Do not optimistically change UI before Supabase succeeds
        await undoMarkAsTaken(user.id, dose.medication_id, dose.scheduled_time, dose.log_id);

        // Show success feedback
        showToast({ message: `${dose.name} medication log removed.`, type: 'success' });

        // Refresh Today's schedule data & History immediately
        await refreshData();
      } catch (err: any) {
        // If undo fails: Keep Taken state, show clear error feedback, log actual Supabase error
        showToast({
          message: err?.message || 'Failed to undo medication log. Please try again.',
          type: 'error'
        });
        console.error('Failed to undo medication log in Supabase:', err);
      } finally {
        setProcessingDoseId(null);
      }
      return;
    }

    try {
      setProcessingDoseId(dose.id);
      // Save medication log to Supabase
      await markAsTaken(user.id, dose.medication_id, dose.scheduled_time);
      
      // Show success feedback
      showToast({ message: `${dose.name} marked as taken.`, type: 'success' });

      // Refresh today's medication data & history
      await refreshData();
    } catch (err: any) {
      // Show a clear error message
      showToast({ 
        message: err?.message || 'Failed to record dose. Please try again.', 
        type: 'error' 
      });
      // Log actual Supabase error in the console for debugging
      console.error('Failed to mark medication as taken in Supabase:', err);
    } finally {
      setProcessingDoseId(null);
    }
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const formatTakenTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return '';
    }
  };

  const formatLogDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    } catch (e) {
      return isoString.split('T')[0];
    }
  };

  const renderTodayTab = () => {
    if (schedule.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyTitle}>No medications scheduled today</Text>
          <Text style={styles.emptySubtitle}>
            Your medication schedule will appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.listGrid, isDesktop && styles.desktopListGrid]}>
        {schedule.map((item) => {
          // Resolve status: Pending, Taken, Missed
          let status: 'Pending' | 'Taken' | 'Missed' = 'Pending';
          if (item.taken) {
            status = 'Taken';
          } else if (isDoseTimePast(item.scheduled_time)) {
            status = 'Missed';
          }

          return (
            <MedicationCard
              key={item.id}
              name={item.name}
              dosage={item.dosage}
              scheduledTime={item.scheduled_time}
              status={status}
              onToggleTaken={() => handleToggleTaken(item)}
              onPress={() => router.push(`/medication-details/${item.medication_id}` as any)}
              disabled={processingDoseId !== null}
              isLoading={processingDoseId === item.id}
              style={isDesktop ? styles.desktopMedCard : styles.mobileMedCard}
            />
          );
        })}
      </View>
    );
  };

  const renderHistoryTab = () => {
    if (history.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyTitle}>No medication history yet</Text>
          <Text style={styles.emptySubtitle}>
            Your medication activity will appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.listGrid, isDesktop && styles.desktopListGrid]}>
        {history.map((log) => {
          const medName = log.medication?.medicine_name || 'Medication';
          const dosage = log.medication?.dosage || '';
          const logDate = formatLogDate(log.created_at);
          const takenDate = log.taken_at ? formatLogDate(log.taken_at) : '';
          const takenTime = formatTakenTime(log.taken_at);

          return (
            <DashboardCard key={log.id} style={isDesktop ? styles.desktopMedCard : styles.mobileMedCard}>
              <View style={styles.historyHeader}>
                <View style={[
                  styles.historyIconCircle,
                  { backgroundColor: log.status === 'Taken' ? 'rgba(46, 125, 50, 0.06)' : 'rgba(198, 40, 40, 0.06)' }
                ]}>
                  <Ionicons
                    name={log.status === 'Taken' ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={log.status === 'Taken' ? Colors.success : Colors.error}
                  />
                </View>
                <View style={styles.historyTitleContainer}>
                  <Text style={styles.historyName}>{medName}</Text>
                  <Text style={styles.historyMetaText}>{dosage}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.historyDetails}>
                <Text style={styles.historyInfoText}>
                  Scheduled: <Text style={styles.boldText}>{logDate} at {log.scheduled_time}</Text>
                </Text>
                 {log.status === 'Taken' && takenTime && (
                  <Text style={[styles.historyInfoText, { marginTop: 4 }]}>
                    Taken: <Text style={styles.boldText}>{takenDate} at {takenTime}</Text>
                  </Text>
                )}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: log.status === 'Taken' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 40, 40, 0.08)', marginTop: 8 }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: log.status === 'Taken' ? Colors.success : Colors.error }
                  ]}>
                    {log.status}
                  </Text>
                </View>
              </View>
            </DashboardCard>
          );
        })}
      </View>
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Medications" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          
          {/* Tab Selection Row */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('Today')}
              style={[styles.tabButton, activeTab === 'Today' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'Today' && styles.tabTextActive]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('History')}
              style={[styles.tabButton, activeTab === 'History' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'History' && styles.tabTextActive]}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Today's schedule date label (only for Today tab) */}
          {activeTab === 'Today' && (
            <View style={styles.dateHeader}>
              <Text style={styles.todayText}>Today's Schedule</Text>
              <Text style={styles.dateSubtext}>{getFormattedDate()}</Text>
            </View>
          )}

          {/* Render Loading/Error/List */}
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.stateText}>Loading schedule...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <PrimaryButton
                title="Retry"
                onPress={activeTab === 'Today' ? loadTodaySchedule : loadHistory}
                style={styles.retryBtn}
              />
            </View>
          ) : activeTab === 'Today' ? (
            renderTodayTab()
          ) : (
            renderHistoryTab()
          )}

        </View>
      </ScrollView>
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
    maxWidth: 600,
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
  dateHeader: {
    marginBottom: Spacing.xlarge,
  },
  todayText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  dateSubtext: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listGrid: {
    flexDirection: 'column',
    gap: Spacing.medium,
    marginBottom: Spacing.xlarge,
    width: '100%',
  },
  desktopListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.large,
  },
  mobileMedCard: {
    width: '100%',
  },
  desktopMedCard: {
    maxWidth: 360,
    minWidth: 280,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: Spacing.medium,
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
    marginBottom: Spacing.xlarge,
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
    marginBottom: Spacing.large,
  },
  retryBtn: {
    minWidth: 120,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    paddingHorizontal: Spacing.medium,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitleContainer: {
    flex: 1,
  },
  historyName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  historyMetaText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.medium,
  },
  historyDetails: {
    alignItems: 'flex-start',
  },
  historyInfoText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
  },
  boldText: {
    color: Colors.text,
    fontWeight: Typography.weights.semibold as any,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.small,
  },
  statusBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
