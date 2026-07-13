import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { DashboardCard } from '../../components/DashboardCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ScreenHeader } from '../../components/ScreenHeader';
import { QuickActionCard } from '../../components/QuickActionCard';
import { AppointmentCard } from '../../components/AppointmentCard';
import { fetchNextAppointment, Appointment } from '../../services/appointmentService';
import { Alert } from '../../utils/alert';
import { supabase } from '../../utils/supabase';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const userName = user?.name || 'Jane Doe';

  const isDesktop = width >= 768;

  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(true);

  const loadNextAppointment = useCallback(async () => {
    if (isLoading || !user) return;
    try {
      setIsLoadingNext(true);

      // Explicitly check for a valid session to prevent anon role execution
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('Supabase session not yet available. Skipping loadNextAppointment.');
        return;
      }

      const appt = await fetchNextAppointment(user.id);
      setNextAppointment(appt);
    } catch (err) {
      console.error('Failed to load next appointment on Home screen:', err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [user, isLoading]);

  // Sync next appointment details on screen focus
  useFocusEffect(
    useCallback(() => {
      loadNextAppointment();
    }, [loadNextAppointment])
  );

  const triggerCall = () => {
    Alert.alert(
      'Emergency Support',
      'This would dial the oncology emergency support line (+1 555-019-2834). Make this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', style: 'destructive', onPress: () => console.log('Dialing emergency...') },
      ]
    );
  };

  const handleQuickAction = (tabRoute: string) => {
    router.push(`/(tabs)/${tabRoute}` as any);
  };

  const renderNextAppointment = () => {
    if (isLoadingNext) {
      return (
        <DashboardCard style={[styles.cardFlex, styles.centerCard]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking schedule...</Text>
        </DashboardCard>
      );
    }

    if (!nextAppointment) {
      return (
        <DashboardCard
          style={[styles.cardFlex, styles.placeholderCard]}
          onPress={() => router.push('/book-appointment')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(21, 101, 192, 0.08)' }]}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.cardLabel}>Next Appointment</Text>
          </View>
          <Text style={styles.noApptTitle}>No Sessions Scheduled</Text>
          <Text style={styles.noApptSubtitle}>
            Tap here to schedule a consultation with your oncologist.
          </Text>
        </DashboardCard>
      );
    }

    return (
      <AppointmentCard
        doctorName={nextAppointment.doctor?.full_name || 'Oncology Specialist'}
        specialization={nextAppointment.doctor?.specialization || 'Oncology'}
        dateTime={`${nextAppointment.appointment_date} at ${nextAppointment.appointment_time}`}
        location={nextAppointment.doctor?.department || 'Oncology Wing'}
        status={nextAppointment.status}
        onPress={() => handleQuickAction('appointments')}
        style={styles.cardFlex}
      />
    );
  };

  return (
    <ResponsiveContainer>
      {/* Show header on mobile only to keep desktop view clean */}
      {!isDesktop && <ScreenHeader title="OncoCare Connect" />}

      <View style={styles.contentPadding}>
        {/* Welcome Header */}
        <View style={[styles.welcomeSection, isDesktop && styles.desktopWelcomeSection]}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.patientName}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarLetter}>{userName.charAt(0)}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Overview Section */}
        <SectionHeader title="Today's Overview" />
        <View style={[styles.overviewGrid, isDesktop && styles.desktopOverviewGrid]}>
          
          {/* Real Next Appointment Render */}
          {renderNextAppointment()}

          {/* Medication Summary Card */}
          <DashboardCard
            style={styles.cardFlex}
            onPress={() => handleQuickAction('medications')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 137, 123, 0.08)' }]}>
                <Ionicons name="bandage" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.cardLabel}>Medications Today</Text>
            </View>
            <Text style={styles.cardTitle}>2 Remaining</Text>
            <Text style={styles.cardSubtitle}>Ondansetron (8mg) • Scheduled: 8:00 PM</Text>
            
            <View style={styles.timeInfoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time-outline" size={14} color={Colors.secondary} />
              </View>
              <Text style={styles.timeText}>Next dose in approximately 4h</Text>
            </View>
            
            <View style={styles.locationRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              </View>
              <Text style={[styles.locationText, { color: Colors.success, fontWeight: '600' }]}>
                2 of 3 doses recorded taken
              </Text>
            </View>
          </DashboardCard>
        </View>

        {/* Quick Actions Grid */}
        <SectionHeader title="Quick Actions" />
        <View style={[styles.actionsGrid, isDesktop && styles.desktopActionsGrid]}>
          <QuickActionCard
            title="Book Slot"
            description="Schedule care"
            icon="calendar-outline"
            iconColor={Colors.primary}
            iconBgColor="rgba(21, 101, 192, 0.06)"
            onPress={() => router.push('/book-appointment')}
            style={isDesktop ? styles.quickActionDesktopCard : styles.quickActionMobileCard}
          />

          <QuickActionCard
            title="Log Symptom"
            description="Track telemetry"
            icon="pulse-outline"
            iconColor={Colors.secondary}
            iconBgColor="rgba(0, 137, 123, 0.06)"
            onPress={() => {
              console.log('[Runtime Log] Navigating to Log Symptom screen from Quick Action');
              router.push('/log-symptom');
            }}
            style={isDesktop ? styles.quickActionDesktopCard : styles.quickActionMobileCard}
          />

          <QuickActionCard
            title="Med Checklist"
            description="Track dosage"
            icon="time-outline"
            iconColor={Colors.warning}
            iconBgColor="rgba(239, 108, 0, 0.06)"
            onPress={() => handleQuickAction('medications')}
            style={isDesktop ? styles.quickActionDesktopCard : styles.quickActionMobileCard}
          />

          <QuickActionCard
            title="Lab Reports"
            description="Check diagnostics"
            icon="document-text-outline"
            iconColor={Colors.success}
            iconBgColor="rgba(46, 125, 50, 0.06)"
            onPress={() => handleQuickAction('reports')}
            style={isDesktop ? styles.quickActionDesktopCard : styles.quickActionMobileCard}
          />
        </View>

        {/* Emergency Assistance Banner */}
        <TouchableOpacity
          style={[styles.emergencyCard, isDesktop && styles.desktopEmergencyCard]}
          activeOpacity={0.9}
          onPress={triggerCall}
        >
          <View style={styles.emergencyIconCircle}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} />
          </View>
          <View style={styles.emergencyTextContainer}>
            <Text style={styles.emergencyTitle}>Emergency Clinical Support</Text>
            <Text style={styles.emergencyDescription}>Febrile/severe symptom hotline. Tap to call support.</Text>
          </View>
          <Ionicons name="call" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  contentPadding: {
    padding: Spacing.large,
    width: '100%',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.large,
    borderRadius: BorderRadius.large,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.medium,
    marginTop: Spacing.small,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  desktopWelcomeSection: {
    paddingVertical: Spacing.xlarge,
    paddingHorizontal: Spacing.xlarge,
    marginBottom: Spacing.large,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  patientName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.title - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
    marginTop: Spacing.tiny,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(21, 101, 192, 0.1)',
  },
  avatarLetter: {
    color: Colors.white,
    fontWeight: Typography.weights.bold as any,
    fontSize: Typography.sizes.section,
  },
  overviewGrid: {
    flexDirection: 'column',
    gap: Spacing.medium,
  },
  desktopOverviewGrid: {
    flexDirection: 'row',
    gap: Spacing.large,
  },
  cardFlex: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    marginBottom: Spacing.medium,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    marginBottom: Spacing.small,
  },
  infoIconContainer: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  locationText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.medium,
  },
  desktopActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Spacing.large,
  },
  quickActionMobileCard: {
    minWidth: '45%',
    flex: 1,
  },
  quickActionDesktopCard: {
    flex: 1,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.error,
    padding: Spacing.large,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.xlarge,
    width: '100%',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  desktopEmergencyCard: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  emergencyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 40, 40, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 1,
    fontWeight: Typography.weights.bold as any,
    color: Colors.error,
    marginBottom: 2,
  },
  emergencyDescription: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  centerCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  loadingText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  placeholderCard: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 180,
    justifyContent: 'center',
  },
  noApptTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginTop: Spacing.small,
    marginBottom: 4,
  },
  noApptSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
