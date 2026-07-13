import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchMedicationDetails, Medication } from '../../services/medicationService';

export default function MedicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [medication, setMedication] = useState<Medication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMedicationDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await fetchMedicationDetails(id);
      setMedication(data);
    } catch (err: any) {
      console.error('Fetch medication details error:', err);
      setErrorMsg('Failed to load medication details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadMedicationDetails();
    }, [loadMedicationDetails])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/medications');
    }
  };

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not Specified';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
      }
    } catch (e) {}
    return dateStr;
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Medication Details" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </ResponsiveContainer>
    );
  }

  if (errorMsg || !medication) {
    return (
      <ResponsiveContainer>
        <ScreenHeader title="Medication Details" showBackButton onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{errorMsg || 'Failed to retrieve medication details.'}</Text>
          <PrimaryButton title="Go Back" onPress={handleBack} style={styles.backBtn} />
        </View>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Medication Details" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          
          <DashboardCard style={styles.mainCard}>
            <View style={styles.medHeader}>
              <View style={styles.avatarCircle}>
                <Ionicons name="medical" size={32} color={Colors.primary} />
              </View>
              <View style={styles.headerMeta}>
                <Text style={styles.medicineName}>{medication.medicine_name}</Text>
                <Text style={styles.dosageLabel}>{medication.dosage}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="repeat-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Frequency</Text>
                  <Text style={styles.infoValue}>{medication.frequency}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>{formatDisplayDate(medication.start_date)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.infoLabel}>End Date</Text>
                  <Text style={styles.infoValue}>{formatDisplayDate(medication.end_date)}</Text>
                </View>
              </View>
            </View>

            {medication.instructions ? (
              <>
                <View style={styles.divider} />
                <View style={styles.instructionsSection}>
                  <Text style={styles.instructionsLabel}>Instructions & Special Directions</Text>
                  <Text style={styles.instructionsValue}>{medication.instructions}</Text>
                </View>
              </>
            ) : null}

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
  medHeader: {
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
  medicineName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  dosageLabel: {
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
  instructionsSection: {
    width: '100%',
  },
  instructionsLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.small,
  },
  instructionsValue: {
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
});
