import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { FormInput } from '../../components/FormInput';
import { PasswordInput } from '../../components/PasswordInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const response = await login(email, password);
      if (!response.success) {
        setGeneralError(response.error || 'Login failed. Please check your credentials.');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      setGeneralError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScreenHeader title="Sign In" showBackButton onBackPress={() => router.replace('/welcome')} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.introHeader}>
          <Text style={styles.welcomeTitle}>
            OncoCare Connect
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome Back
          </Text>
          <Text style={styles.tagline}>
            Access appointments, medication checklists, and diagnostic reports securely.
          </Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
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

          <PasswordInput
            label="Password"
            placeholder="Enter secure password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    padding: Spacing.xlarge,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  introHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxlarge,
  },
  welcomeTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.title,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.tiny,
  },
  welcomeSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  tagline: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
    paddingHorizontal: Spacing.medium,
  },
  errorBanner: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.large,
  },
  errorBannerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: Spacing.xlarge,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xlarge,
    paddingVertical: Spacing.tiny,
  },
  forgotText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: Typography.weights.medium as any,
  },
  submitButton: {
    width: '100%',
    marginTop: Spacing.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.small,
    marginTop: Spacing.large,
  },
  footerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  signUpText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold as any,
  },
});
