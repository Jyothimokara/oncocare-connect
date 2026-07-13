import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FormInput } from '../../components/FormInput';
import { PasswordInput } from '../../components/PasswordInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Alert } from '../../utils/alert';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  
  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setPhoneError('');
    setDobError('');
    setGenderError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError('Full name is required.');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    if (!phone.trim()) {
      setPhoneError('Phone number is required.');
      isValid = false;
    }

    // Basic DOB validation: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dob.trim()) {
      setDobError('Date of birth is required.');
      isValid = false;
    } else if (!dateRegex.test(dob)) {
      setDobError('Please use YYYY-MM-DD format.');
      isValid = false;
    }

    if (!gender.trim()) {
      setGenderError('Gender details are required (e.g. Female, Male, Other).');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    const profileData = {
      name,
      email,
      dob,
      gender,
      phone,
    };

    try {
      const response = await register(profileData, password) as any;
      if (!response.success) {
        setGeneralError(response.error || 'Registration failed. Please try again.');
      } else {
        if (response.needsConfirmation) {
          showToast({
            message: response.message || 'Registration successful! Please check your email to verify your account.',
            type: 'info'
          });
          router.replace('/(auth)/login');
        } else {
          showToast({
            message: 'Registration successful! Welcome to OncoCare Connect.',
            type: 'success'
          });
          router.replace('/(tabs)/home');
        }
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScreenHeader title="Sign Up" showBackButton onBackPress={() => router.replace('/welcome')} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.introHeader}>
          <Text style={styles.welcomeSubtitle}>
            Create your secure patient account. All communications and health data are encrypted.
          </Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <FormInput
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            onChangeText={setName}
            error={nameError}
            autoCapitalize="words"
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter secure password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            label="Phone Number"
            placeholder="e.g. +1 (555) 019-1234"
            value={phone}
            onChangeText={setPhone}
            error={phoneError}
            keyboardType="phone-pad"
          />

          <FormInput
            label="Date of Birth"
            placeholder="e.g. 1985-05-15 (YYYY-MM-DD)"
            value={dob}
            onChangeText={setDob}
            error={dobError}
            keyboardType="numbers-and-punctuation"
          />

          <FormInput
            label="Gender"
            placeholder="e.g. Female, Male, or Prefer not to say"
            value={gender}
            onChangeText={setGender}
            error={genderError}
            autoCapitalize="sentences"
          />

          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.signInText}>Sign In</Text>
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
    padding: Spacing.xlarge,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  introHeader: {
    marginBottom: Spacing.xlarge,
  },
  welcomeSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
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
  submitButton: {
    width: '100%',
    marginTop: Spacing.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.small,
    marginVertical: Spacing.large,
  },
  footerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  signInText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold as any,
  },
});
