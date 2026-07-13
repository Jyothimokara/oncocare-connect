import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { DashboardCard } from '../components/DashboardCard';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;

  const benefits = [
    { text: 'Manage your appointments', icon: 'calendar-outline' },
    { text: 'Track medications and symptoms', icon: 'pulse-outline' },
    { text: 'Access your medical reports', icon: 'document-text-outline' },
  ];

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <ResponsiveContainer scrollable={true}>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        
        {/* Left Column: Hero Content & Call to Actions */}
        <View style={[styles.leftColumn, isDesktop && styles.desktopLeftColumn]}>
          {/* Branding Logo */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="medical" size={24} color={Colors.white} />
            </View>
            <Text style={styles.brandText}>OncoCare Connect</Text>
          </View>

          {/* Hero Titles */}
          <Text style={styles.heroHeading}>Your care journey, connected.</Text>
          <Text style={styles.heroDescription}>
            Manage appointments, medications, symptoms, medical reports, and your health information in one secure place.
          </Text>

          {/* Benefits Bullet List */}
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name={benefit.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          {/* Call to Actions */}
          <View style={styles.actionsContainer}>
            <PrimaryButton
              title="Get Started"
              onPress={handleGetStarted}
              style={styles.getStartedBtn}
            />
            <TouchableOpacity
              onPress={handleSignIn}
              activeOpacity={0.7}
              style={styles.signInLink}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Column: Abstract Healthcare Dashboard Preview Visual */}
        <View style={[styles.rightColumn, isDesktop && styles.desktopRightColumn]}>
          <View style={styles.abstractDashboardBg}>
            
            {/* Appointment Preview Card */}
            <DashboardCard style={[styles.previewCard, styles.previewApptCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(21, 101, 192, 0.08)' }]}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.cardLabel}>Next Consultation</Text>
              </View>
              <Text style={styles.cardTitle}>Dr. Robert Chen</Text>
              <Text style={styles.cardSubtitle}>Tomorrow at 10:00 AM</Text>
            </DashboardCard>

            {/* Medication Tracker Preview Card */}
            <DashboardCard style={[styles.previewCard, styles.previewMedCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 137, 123, 0.08)' }]}>
                  <Ionicons name="bandage" size={16} color={Colors.secondary} />
                </View>
                <Text style={styles.cardLabel}>Medication Log</Text>
              </View>
              <Text style={styles.cardTitle}>Ondansetron 8mg</Text>
              <View style={styles.badgeRow}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.badgeText}>Dose recorded taken</Text>
              </View>
            </DashboardCard>

            {/* Medical Reports Preview Card */}
            <DashboardCard style={[styles.previewCard, styles.previewReportCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
                  <Ionicons name="document-text" size={16} color={Colors.success} />
                </View>
                <Text style={styles.cardLabel}>Diagnostics</Text>
              </View>
              <Text style={styles.cardTitle}>Complete Blood Count</Text>
              <Text style={styles.cardSubtitle}>Uploaded 2 days ago</Text>
            </DashboardCard>

          </View>
        </View>

      </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    padding: Spacing.large,
    justifyContent: 'center',
    width: '100%',
  },
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.huge,
    gap: Spacing.huge,
  },
  leftColumn: {
    flex: 1.2,
    width: '100%',
    justifyContent: 'center',
  },
  desktopLeftColumn: {
    paddingRight: Spacing.xlarge,
  },
  rightColumn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.huge,
  },
  desktopRightColumn: {
    marginTop: 0,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    marginBottom: Spacing.large,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  heroHeading: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.branding,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    lineHeight: 42,
    marginBottom: Spacing.medium,
  },
  heroDescription: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 2,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.body + 2,
    marginBottom: Spacing.xlarge,
  },
  benefitsContainer: {
    gap: Spacing.medium,
    marginBottom: Spacing.huge,
    width: '100%',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  benefitIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(21, 101, 192, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.medium,
  },
  getStartedBtn: {
    width: '100%',
    maxWidth: 320,
  },
  signInLink: {
    paddingVertical: Spacing.small,
  },
  signInText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  signInHighlight: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold as any,
  },
  abstractDashboardBg: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1,
    backgroundColor: 'rgba(21, 101, 192, 0.03)',
    borderRadius: BorderRadius.large * 2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
    position: 'relative',
  },
  previewCard: {
    width: '85%',
    padding: Spacing.medium,
    position: 'absolute',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  previewApptCard: {
    top: '10%',
    left: '5%',
    transform: [{ rotate: '-3deg' }],
  },
  previewMedCard: {
    top: '42%',
    right: '5%',
    transform: [{ rotate: '2deg' }],
  },
  previewReportCard: {
    bottom: '10%',
    left: '8%',
    transform: [{ rotate: '-1deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    marginBottom: Spacing.small,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 1,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.success,
  },
});
