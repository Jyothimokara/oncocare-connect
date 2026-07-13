import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { StatusBadge } from './StatusBadge';
import { DashboardCard } from './DashboardCard';

import { TouchableOpacity } from 'react-native';

interface AppointmentCardProps {
  doctorName: string;
  specialization: string;
  dateTime: string;
  location: string;
  status: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  onReschedule?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  doctorName,
  specialization,
  dateTime,
  location,
  status,
  onPress,
  style,
  onReschedule,
  onCancel,
  onDelete,
}) => {
  // Get initial of doctor name for avatar
  const doctorInitial = doctorName.replace('Dr. ', '').charAt(0) || 'D';

  return (
    <DashboardCard style={[styles.card, style]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: '100%' }}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{doctorInitial}</Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.specialization}>{specialization}</Text>
          </View>
          <StatusBadge status={status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.detailText}>{dateTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.detailText}>{location}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Row */}
      {(onReschedule || onCancel || onDelete || onPress) && (
        <View style={styles.actionRow}>
          {onPress && (
            <TouchableOpacity onPress={onPress} style={styles.actionButton}>
              <Ionicons name="eye-outline" size={14} color={Colors.primary} />
              <Text style={styles.actionText}>Details</Text>
            </TouchableOpacity>
          )}

          {onReschedule && (
            <TouchableOpacity onPress={onReschedule} style={styles.actionButton}>
              <Ionicons name="create-outline" size={14} color={Colors.secondary} />
              <Text style={[styles.actionText, { color: Colors.secondary }]}>Reschedule</Text>
            </TouchableOpacity>
          )}

          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.actionButton}>
              <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  avatarText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
  },
  doctorInfo: {
    flex: 1,
    marginRight: Spacing.small,
  },
  doctorName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  specialization: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.medium,
  },
  detailsContainer: {
    gap: Spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.medium,
    paddingTop: Spacing.small,
    justifyContent: 'flex-start',
    gap: Spacing.medium,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.background,
  },
  actionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium as any,
    color: Colors.primary,
  },
});
