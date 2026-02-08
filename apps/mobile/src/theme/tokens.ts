/**
 * WATS – Design tokens
 * Primary = WATS logo blue (#0078D4). Premium, modern, consistent.
 */

export const colors = {
  background: '#F8FAFC',
  backgroundWarm: '#F5F0E8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#0078D4',
  primaryDark: '#0067C1',
  secondary: '#E8E4DC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  onPrimary: '#FFFFFF',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 26, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '700' as const },
  subheading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '500' as const },
  small: { fontSize: 12, fontWeight: '500' as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
