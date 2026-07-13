import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './index';

function RootLayoutNav() {
  const { user, isOnboarded, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';
    const onWelcome = segments[0] === 'welcome';

    if (!isOnboarded) {
      if (!isOnboarding) {
        router.replace('/onboarding');
      }
    } else if (!user) {
      if (!inAuthGroup && !onWelcome) {
        router.replace('/welcome');
      }
    } else {
      if (segments[0] === 'onboarding' || inAuthGroup || onWelcome || !segments.length) {
        router.replace('/(tabs)/home');
      }
    }
  }, [user, isOnboarded, isLoading, segments]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(auth)/forgot-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book-appointment" />
      <Stack.Screen name="report-details/[id]" />
      <Stack.Screen name="log-symptom" />
      <Stack.Screen name="appointment-details/[id]" />
      <Stack.Screen name="reschedule-appointment/[id]" />
      <Stack.Screen name="add-medication" />
      <Stack.Screen name="medication-details/[id]" />
      <Stack.Screen name="edit-medication/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </ToastProvider>
    </AuthProvider>
  );
}
