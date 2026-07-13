import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  iconBgColor,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconBg, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.large,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 140,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
