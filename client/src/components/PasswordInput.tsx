import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface PasswordInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const toggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : null,
            style,
          ]}
          secureTextEntry={!isPasswordVisible}
          placeholderTextColor={Colors.textSecondary}
          {...props}
        />
        <TouchableOpacity
          onPress={toggleVisibility}
          activeOpacity={0.7}
          style={styles.iconContainer}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.medium,
    width: '100%',
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Spacing.tiny + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingLeft: Spacing.medium,
    paddingRight: Spacing.huge, // Give space for the eye icon
    fontSize: Typography.sizes.body,
    fontFamily: Typography.fontFamily,
    color: Colors.text,
    backgroundColor: Colors.surface,
    width: '100%',
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    position: 'absolute',
    right: Spacing.medium,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    marginTop: Spacing.tiny,
  },
});
