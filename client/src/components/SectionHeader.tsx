import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionTitle,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionTitle && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionTitle}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
    marginTop: Spacing.large,
    width: '100%',
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  actionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.primary,
  },
});
