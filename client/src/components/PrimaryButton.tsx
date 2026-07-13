import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isInteractionDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isInteractionDisabled}
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.medium + 2, // 14px padding
    paddingHorizontal: Spacing.xlarge,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: Colors.white,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.button,
    fontWeight: Typography.weights.semibold as any,
  },
});
