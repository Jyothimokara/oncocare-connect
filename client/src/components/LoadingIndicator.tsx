import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading details...',
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : styles.inline]}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    zIndex: 999,
  },
  inline: {
    padding: Spacing.xlarge,
  },
  card: {
    padding: Spacing.xlarge,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 150,
  },
  message: {
    marginTop: Spacing.medium,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text,
    textAlign: 'center',
  },
});
