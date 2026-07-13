export const Colors = {
  primary: '#1565C0', // Deep Healthcare Blue
  secondary: '#00897B', // Calm Teal
  background: '#F6F8FB', // Very Light Cool Gray
  surface: '#FFFFFF', // Pure White
  text: '#172033', // Dark Navy/Charcoal
  textSecondary: '#667085', // Muted Gray
  success: '#2E7D32', // Accessible Forest Green
  warning: '#EF6C00', // Accessible Deep Amber
  error: '#C62828', // Accessible Crimson Red
  border: '#E4E7EC', // Soft Neutral Gray
  overlay: 'rgba(23, 32, 51, 0.4)', // Dark semi-transparent
  white: '#FFFFFF',
} as const;

export const Spacing = {
  tiny: 4,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  xxlarge: 32,
  huge: 48,
} as const;

export const Typography = {
  fontFamily: 'System', // Standard clean system font
  sizes: {
    branding: 32,
    title: 24,
    section: 18,
    card: 16,
    body: 14,
    caption: 12,
    button: 15,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  lineHeights: {
    body: 20,
    title: 32,
    caption: 16,
  },
} as const;

export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 9999,
} as const;
