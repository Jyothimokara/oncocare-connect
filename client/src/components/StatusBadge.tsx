import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status.toLowerCase();

  let bgColor = 'rgba(102, 112, 133, 0.08)'; // Default Gray
  let textColor: string = Colors.textSecondary;

  if (normalizedStatus === 'confirmed' || normalizedStatus === 'taken' || normalizedStatus === 'final') {
    bgColor = 'rgba(46, 125, 50, 0.08)'; // Success Green light opacity
    textColor = Colors.success;
  } else if (normalizedStatus === 'pending' || normalizedStatus === 'due') {
    bgColor = 'rgba(239, 108, 0, 0.08)'; // Warning Amber light opacity
    textColor = Colors.warning;
  } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'skipped') {
    bgColor = 'rgba(198, 40, 40, 0.08)'; // Error Red light opacity
    textColor = Colors.error;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: Spacing.tiny,
    paddingHorizontal: Spacing.small + 2,
    borderRadius: BorderRadius.small + 2,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold as any,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
