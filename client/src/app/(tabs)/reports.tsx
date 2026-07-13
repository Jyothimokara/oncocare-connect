import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { DashboardCard } from '../../components/DashboardCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ReportCard } from '../../components/ReportCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { fetchPatientReports, MedicalReport } from '../../services/reportService';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReports = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchPatientReports(user.id);
      setReports(data);
    } catch (err: any) {
      setErrorMsg('Failed to load diagnostic reports. Please refresh.');
      console.error('Database medical reports fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Sync reports when tab receives focus
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const formatReportDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const options: Intl.DateTimeFormatOptions = { month: 'long', day: '2-digit', year: 'numeric' };
      return dateObj.toLocaleDateString('en-US', options);
    } catch (e) {
      return dateStr;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading diagnostic reports...</Text>
        </View>
      );
    }

    if (errorMsg) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <PrimaryButton title="Retry" onPress={loadReports} style={styles.retryBtn} />
        </View>
      );
    }

    if (reports.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={40} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No medical reports are available yet.</Text>
          <Text style={styles.emptySubtitle}>
            Your clinical files, biochemistry panel lab results, and diagnostic imaging scans will be listed here once reviewed by your team.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.listGrid, isDesktop && styles.desktopListGrid]}>
        {reports.map((item) => {
          const doctorName = item.doctor?.full_name || 'Oncology Specialist';
          return (
            <ReportCard
              key={item.id}
              name={item.report_name}
              type={item.report_type}
              date={formatReportDate(item.report_date)}
              doctor={doctorName}
              status={item.status}
              onPress={() => router.push(`/report-details/${item.id}` as any)}
              style={isDesktop ? styles.desktopReportCard : styles.mobileReportCard}
            />
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
      <ScreenHeader title="Medical Reports" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Reports Introduction Card */}
          <DashboardCard style={[styles.infoCard, isDesktop && styles.desktopInfoCard]}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-text" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Diagnostic Reports</Text>
              <Text style={styles.infoSubtitle}>
                Review official clinical documents, laboratory panels, and scanning results ordered by your clinical team.
              </Text>
            </View>
          </DashboardCard>

          {/* Section Title */}
          {reports.length > 0 && !isLoading && (
            <Text style={styles.sectionHeader}>Available Reports</Text>
          )}

          {/* Available Reports list grid */}
          {renderContent()}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
  },
  desktopInfoCard: {
    maxWidth: 800,
    alignSelf: 'flex-start',
    width: '100%',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(0, 137, 123, 0.06)',
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
  sectionHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  listGrid: {
    flexDirection: 'column',
    gap: Spacing.medium,
    width: '100%',
  },
  desktopListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.large,
  },
  mobileReportCard: {
    width: '100%',
  },
  desktopReportCard: {
    maxWidth: 360,
    minWidth: 320,
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
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    paddingHorizontal: Spacing.medium,
  },
});
