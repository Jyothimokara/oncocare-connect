import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { DashboardCard } from './DashboardCard';

interface MedicationCardProps {
  name: string;
  dosage: string;
  scheduledTime: string;
  status: 'Pending' | 'Taken' | 'Missed';
  onToggleTaken: () => void;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  name,
  dosage,
  scheduledTime,
  status,
  onToggleTaken,
  style,
  onPress,
  disabled = false,
  isLoading = false,
}) => {
  const isTaken = status === 'Taken';
  const isMissed = status === 'Missed';

  const getStatusCircleConfig = () => {
    switch (status) {
      case 'Taken':
        return { bg: 'rgba(46, 125, 50, 0.06)', icon: 'checkmark-circle' as const, color: Colors.success };
      case 'Missed':
        return { bg: 'rgba(198, 40, 40, 0.06)', icon: 'alert-circle' as const, color: Colors.error };
      case 'Pending':
      default:
        return { bg: 'rgba(239, 108, 0, 0.06)', icon: 'time-outline' as const, color: Colors.warning };
    }
  };

  const config = getStatusCircleConfig();

  return (
    <DashboardCard style={[styles.card, style]}>
      <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} style={{ width: '100%' }}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.info}>
                {dosage} • Scheduled: {scheduledTime}
              </Text>
              {isMissed && (
                <View style={styles.missedTag}>
                  <Text style={styles.missedTagText}>Missed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onToggleTaken}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
          style={[
            styles.checkButton,
            isTaken ? styles.checkButtonTaken : styles.checkButtonPending,
            (disabled || isLoading) && { opacity: 0.6 }
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isTaken ? Colors.white : Colors.secondary} />
          ) : isTaken ? (
            <>
              <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
              <Text style={styles.buttonTextTaken}>Taken</Text>
            </>
          ) : (
            <>
              <Ionicons name="ellipse-outline" size={16} color={Colors.secondary} />
              <Text style={styles.buttonTextPending}>Mark Taken</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </DashboardCard>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
    minWidth: 280,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.small,
    marginTop: 2,
  },
  info: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  missedTag: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  missedTagText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
    color: Colors.error,
  },
  actionRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: Spacing.medium,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    paddingVertical: Spacing.small - 2,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  checkButtonTaken: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkButtonPending: {
    borderColor: Colors.secondary,
    backgroundColor: 'transparent',
  },
  buttonTextTaken: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold as any,
    fontSize: Typography.sizes.caption + 1,
  },
  buttonTextPending: {
    color: Colors.secondary,
    fontWeight: Typography.weights.semibold as any,
    fontSize: Typography.sizes.caption + 1,
  },
});
