import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Alert } from '../../utils/alert';

import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSendLink = async () => {
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required.');
      return;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(email);
      if (response.success) {
        setIsSuccess(true);
      } else {
        Alert.alert('Error', response.error || 'Failed to dispatch reset instructions. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to dispatch reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScreenHeader title="Recover Password" showBackButton onBackPress={() => router.replace('/(auth)/login')} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!isSuccess ? (
          <View style={styles.formContainer}>
            <Text style={styles.instructions}>
              Enter your registered clinical email address below. We will send you instructions to securely reset your password.
            </Text>

            <FormInput
              label="Email Address"
              placeholder="e.g. patient@oncocare.com"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PrimaryButton
              title="Send Recovery Link"
              onPress={handleSendLink}
              isLoading={isLoading}
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="mail-open-outline" size={50} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              A secure password reset link has been dispatched to {email}. If the address is registered with us, you will receive the reset instructions shortly.
            </Text>

            <SecondaryButton
              title="Back to Sign In"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backButton}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xlarge,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  formContainer: {
    width: '100%',
  },
  instructions: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    marginBottom: Spacing.xxlarge,
  },
  submitButton: {
    width: '100%',
    marginTop: Spacing.large,
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xlarge,
  },
  successTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.title - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  successText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    marginBottom: Spacing.xxlarge,
  },
  backButton: {
    width: '100%',
  },
});
