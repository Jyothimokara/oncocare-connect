import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const { isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Professional clinical icon as logo */}
        <View style={styles.iconCircle}>
          <Ionicons name="medical" size={60} color={Colors.white} />
        </View>
        <Text style={styles.appName}>OncoCare Connect</Text>
        <Text style={styles.tagline}>Your Partner in Patient Care & Coordination</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing secure environment...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xlarge,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.branding,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  tagline: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.medium as any,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
  },
  spinner: {
    marginBottom: Spacing.small,
  },
  loadingText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
