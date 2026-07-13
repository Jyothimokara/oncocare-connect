import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    title: 'Manage Hospital Appointments',
    description: 'Find clinical specialists, check weekly schedules, and book slots in just a few taps. Keep track of upcoming appointments effortlessly.',
    icon: 'calendar-outline',
  },
  {
    id: 2,
    title: 'Track Medications & Care',
    description: 'Log and monitor daily prescriptions. Receive timers and mark logs to ensure adherence to critical chemotherapeutic cycles.',
    icon: 'bandage-outline',
  },
  {
    id: 3,
    title: 'Access Patient Services',
    description: 'Instantly view medical lab reports and symptom logs. Directly access hospital helpdesks and emergency protocols whenever you need them.',
    icon: 'shield-checkmark-outline',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    // Redirects automatically via AuthProvider guard in _layout.tsx
  };

  const currentSlide = ONBOARDING_DATA[currentIndex];

  return (
    <View style={styles.screenBg}>
      <SafeAreaView style={styles.container}>
        {/* Header Skip button */}
        <View style={styles.header}>
          {currentIndex < ONBOARDING_DATA.length - 1 ? (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View /> // empty spacing
          )}
        </View>

        {/* Slide Content */}
        <View style={styles.slideContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name={currentSlide.icon as any} size={80} color={Colors.primary} />
          </View>

          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        {/* Footer Navigation Area */}
        <View style={styles.footer}>
          {/* Progress indicators */}
          <View style={styles.indicatorContainer}>
            {ONBOARDING_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex ? styles.indicatorActive : null,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <PrimaryButton
            title={currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBg: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xlarge,
  },
  skipText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium as any,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxlarge,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(21, 101, 192, 0.08)', // Light opacity primary
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxlarge,
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.title - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body + 2,
  },
  footer: {
    paddingHorizontal: Spacing.xlarge,
    paddingBottom: Spacing.xxlarge,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xlarge,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.tiny,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  actionButton: {
    width: '100%',
  },
});
