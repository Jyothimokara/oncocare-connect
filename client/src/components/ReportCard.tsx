import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { StatusBadge } from './StatusBadge';
import { DashboardCard } from './DashboardCard';

interface ReportCardProps {
  name: string;
  type: string;
  date: string;
  doctor: string;
  status: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  name,
  type,
  date,
  doctor,
  status,
  onPress,
  style,
}) => {
  return (
    <DashboardCard onPress={onPress} style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.metadata}>
            {type} • {date}
          </Text>
          <Text style={styles.doctor}>Ordered by: {doctor}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} style={styles.chevron} />
      </View>

      <View style={styles.footer}>
        <StatusBadge status={status} />
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
    minWidth: 320,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingRight: Spacing.small,
  },
  name: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    lineHeight: 22,
  },
  metadata: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
  },
  doctor: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    alignSelf: 'center',
  },
  footer: {
    marginTop: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.medium,
  },
});
