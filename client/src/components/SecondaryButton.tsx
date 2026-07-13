import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
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
        <ActivityIndicator size="small" color={Colors.secondary} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.xlarge,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    borderColor: Colors.border,
  },
  text: {
    color: Colors.secondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.button,
    fontWeight: Typography.weights.semibold as any,
  },
});
