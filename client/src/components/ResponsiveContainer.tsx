import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  scrollable = true,
}) => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const segments = useSegments();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDesktop = width >= 768;

  const navItems = [
    { name: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { name: 'appointments', label: 'Appointments', icon: 'calendar-outline', activeIcon: 'calendar' },
    { name: 'medications', label: 'Medications', icon: 'bandage-outline', activeIcon: 'bandage' },
    { name: 'reports', label: 'Reports', icon: 'document-text-outline', activeIcon: 'document-text' },
    { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const currentTab = segments[1] || 'home';

  const handleNav = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      const res = await logout();
      if (res && !res.success) {
        showToast({ message: res.error || 'Failed to sign out. Please try again.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Logout handler exception:', err);
      showToast({ message: err?.message || 'Failed to sign out. Please try again.', type: 'error' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Render Top Header Navigation for Desktop/Web
  const renderDesktopHeader = () => {
    return (
      <View style={styles.desktopHeaderBg}>
        <View style={styles.desktopHeaderContainer}>
          {/* Logo Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="medical" size={20} color={Colors.white} />
            </View>
            <Text style={styles.brandName}>
              OncoCare Connect
            </Text>
          </View>

          {/* Navigation Links */}
          <View style={styles.desktopNavLinks}>
            {navItems.map((item) => {
              const isActive = currentTab === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => handleNav(item.name)}
                  activeOpacity={0.7}
                  style={[
                    styles.desktopNavLink,
                    isActive && styles.desktopNavLinkActive,
                  ]}
                >
                  <Ionicons
                    name={(isActive ? item.activeIcon : item.icon) as any}
                    size={18}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                    style={styles.navIconSpacing}
                  />
                  <Text
                    style={[
                      styles.desktopNavLinkText,
                      isActive && styles.desktopNavLinkTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sign Out Action */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.desktopSignOut, isLoggingOut && { opacity: 0.5 }]}
            activeOpacity={0.7}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.desktopSignOutText}>
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Content Wrapper
  const content = (
    <View style={[styles.mainContent, isDesktop && styles.desktopContentMaxWidth]}>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {isDesktop && user && renderDesktopHeader()}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            isDesktop && styles.desktopScrollContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.flexContainer, isDesktop && styles.desktopFlexContainer]}>
          {content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flexContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  desktopFlexContainer: {
    paddingTop: Spacing.xlarge,
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  desktopScrollContainer: {
    paddingVertical: Spacing.xlarge,
  },
  mainContent: {
    width: '100%',
    flex: 1,
  },
  desktopContentMaxWidth: {
    maxWidth: 1200,
    paddingHorizontal: Spacing.xlarge,
  },
  // Desktop Top Navigation Header Styles
  desktopHeaderBg: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      },
    }),
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  desktopHeaderContainer: {
    width: '100%',
    maxWidth: 1200,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xlarge,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  brandIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  desktopNavLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  desktopNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  desktopNavLinkActive: {
    backgroundColor: 'rgba(21, 101, 192, 0.05)',
    borderColor: 'rgba(21, 101, 192, 0.1)',
  },
  navIconSpacing: {
    marginRight: 6,
  },
  desktopNavLinkText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium as any,
    color: Colors.textSecondary,
  },
  desktopNavLinkTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold as any,
  },
  desktopSignOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.15)',
    backgroundColor: 'rgba(198, 40, 40, 0.02)',
  },
  desktopSignOutText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.error,
  },
});
