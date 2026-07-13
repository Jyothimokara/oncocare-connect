import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchReportById, getSignedUrl, MedicalReport } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/reports');
    }
  };

  const [report, setReport] = useState<MedicalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  useEffect(() => {
    async function loadReportDetails() {
      if (!id) return;
      try {
        setIsLoading(true);
        setErrorMsg('');
        const data = await fetchReportById(id);
        setReport(data);
      } catch (err: any) {
        setErrorMsg('Failed to load report details.');
        console.error('Database medical report fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportDetails();
  }, [id]);

  const handleViewFile = async () => {
    if (!report || !report.file_url) {
      showToast({ message: 'Report document is not available.', type: 'error' });
      return;
    }

    try {
      setIsFetchingUrl(true);
      const signedUrl = await getSignedUrl(report.file_url);
      
      // Open the time-limited secure signed URL in device browser
      const supported = await Linking.canOpenURL(signedUrl);
      if (supported) {
        await Linking.openURL(signedUrl);
      } else {
        showToast({ message: 'Device does not support opening document links.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: 'Access Denied: Unable to retrieve secure file.', type: 'error' });
      console.error('Supabase signed URL fetch error:', err);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Report Details" showBackButton onBackPress={handleBack} />
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Retrieving report details...</Text>
        </View>
      </ResponsiveContainer>
    );
  }

  if (errorMsg || !report) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Report Details" showBackButton onBackPress={handleBack} />
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg || 'Report not found.'}</Text>
          <SecondaryButton title="Go Back" onPress={handleBack} />
        </View>
      </ResponsiveContainer>
    );
  }

  const doctorName = report.doctor?.full_name || 'Oncology Specialist';
  const doctorSpec = report.doctor?.specialization || 'Oncology';

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Report Details" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsContainer}>
          {/* Main Info Card */}
          <DashboardCard style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleWrapper}>
                <Text style={styles.reportType}>{report.report_type}</Text>
                <Text style={styles.reportName}>{report.report_name}</Text>
              </View>
              <StatusBadge status={report.status} />
            </View>

            <View style={styles.divider} />

            {/* Structured Metadata Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.label}>Report Date</Text>
                  <Text style={styles.value}>{report.report_date}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.label}>Ordering Provider</Text>
                  <Text style={styles.value}>{doctorName}</Text>
                  <Text style={styles.specSub}>{doctorSpec}</Text>
                </View>
              </View>

              {report.doctor?.department && (
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="location-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.label}>Facility / Clinic</Text>
                    <Text style={styles.value}>{report.doctor.department}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.success} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.label}>Security Status</Text>
                  <Text style={[styles.value, { color: Colors.success, fontWeight: '600' }]}>
                    HIPAA Redacted (Demo Encrypted Session)
                  </Text>
                </View>
              </View>
            </View>
          </DashboardCard>

          {/* Secure Document Access Card */}
          <DashboardCard style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>Secure File Access</Text>
            <Text style={styles.actionCardDesc}>
              Medical files are stored in a private Supabase Storage bucket. Access links expire within 60 seconds of generation for security.
            </Text>
            
            {report.file_url ? (
              <PrimaryButton
                title={isFetchingUrl ? "Retrieving secure link..." : "View Report"}
                onPress={handleViewFile}
                isLoading={isFetchingUrl}
                disabled={isFetchingUrl}
                style={styles.actionBtn}
              />
            ) : (
              <View style={styles.noFileWarning}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.noFileText}>Report document is not available.</Text>
              </View>
            )}
          </DashboardCard>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.large,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: Spacing.large,
  },
  mainCard: {
    padding: Spacing.large,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.medium,
  },
  titleWrapper: {
    flex: 1,
  },
  reportType: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reportName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(21, 101, 192, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
  },
  specSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionCard: {
    padding: Spacing.large,
    backgroundColor: Colors.surface,
  },
  actionCardTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  actionCardDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.large,
  },
  actionBtn: {
    width: '100%',
  },
  noFileWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    gap: Spacing.small,
  },
  noFileText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  stateContainer: {
    flex: 1,
    padding: Spacing.huge,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: Spacing.large,
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
});
