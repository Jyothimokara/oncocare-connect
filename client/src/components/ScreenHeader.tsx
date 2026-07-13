import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
}) => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBackButton ? (
            <TouchableOpacity
              onPress={() => {
                if (onBackPress) {
                  onBackPress();
                } else if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightContainer}>
          {rightIcon && onRightPress ? (
            <TouchableOpacity
              onPress={onRightPress}
              activeOpacity={0.7}
              style={styles.rightButton}
            >
              <Ionicons name={rightIcon} size={24} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.divider} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
  },
  leftContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
