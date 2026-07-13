import { Alert as RNAlert, Platform } from 'react-native';

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{ text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    options?: { cancelable?: boolean }
  ) => {
    if (Platform.OS === 'web') {
      const msg = message ? `\n${message}` : '';
      if (buttons && buttons.length > 0) {
        // If buttons are provided, decide between alert or confirm style
        const confirmButton = buttons.find((b) => b.style !== 'cancel') || buttons[0];
        const cancelButton = buttons.find((b) => b.style === 'cancel');

        if (buttons.length === 1) {
          window.alert(`${title}${msg}`);
          if (confirmButton.onPress) confirmButton.onPress();
        } else {
          const result = window.confirm(`${title}${msg}`);
          if (result) {
            if (confirmButton.onPress) confirmButton.onPress();
          } else {
            if (cancelButton && cancelButton.onPress) cancelButton.onPress();
          }
        }
      } else {
        window.alert(`${title}${msg}`);
      }
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};
