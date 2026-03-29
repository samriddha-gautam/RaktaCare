// styles/globalStyles.ts
import { StyleSheet } from 'react-native';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;      // slightly different surface for nesting
    primary: string;
    primaryLight: string;     // tinted backgrounds behind primary
    accent: string;           // secondary interactive color
    danger: string;
    dangerLight: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    text: string;
    textSecondary: string;
    textMuted: string;        // even lighter text (hints, IDs)
    border: string;
    shadow: string;
    overlay: string;          // loading overlays, backdrops
    inputBg: string;          // input background
    white: string;            // always white (buttons text etc.)
  };
  spacing: {
    xs: number;   // 4
    sm: number;   // 8
    md: number;   // 16
    lg: number;   // 24
    xl: number;   // 32
    xxl: number;  // 48
  };
  radii: {
    sm: number;   // 6  – chips, badges
    md: number;   // 10 – inputs, small cards
    lg: number;   // 14 – cards, sections
    xl: number;   // 20 – hero cards, preview cards
    full: number; // 999 – circular / pill
  };
  typography: {
    hero: number;     // 32 – page hero titles
    h1: number;       // 28 – page titles
    h2: number;       // 22 – section titles
    h3: number;       // 18 – card titles
    body: number;     // 16 – default body
    bodySmall: number; // 14
    caption: number;  // 12
    tiny: number;     // 11
  };
  shadow: {
    sm: object;
    md: object;
  };
}

// ─── Light Theme ─────────────────────────────────────────────
export const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F6F7F9',
    surfaceAlt: '#F0F1F3',
    primary: '#cb1717',
    primaryLight: '#FEF2F2',
    accent: '#2563EB',
    danger: '#ff0000',
    dangerLight: '#FEE2E2',
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    shadow: '#000000',
    overlay: 'rgba(255, 255, 255, 0.7)',
    inputBg: '#F9FAFB',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  typography: {
    hero: 32,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 11,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

// ─── Dark Theme ──────────────────────────────────────────────
export const darkTheme: Theme = {
  colors: {
    background: '#0F0F0F',
    surface: '#1C1C1E',
    surfaceAlt: '#2C2C2E',
    primary: '#cb1717',
    primaryLight: '#2A1515',
    accent: '#3B82F6',
    danger: '#ff0000',
    dangerLight: '#3B1515',
    success: '#22C55E',
    successLight: '#14352A',
    warning: '#F59E0B',
    warningLight: '#352A14',
    text: '#E5E5EA',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    border: '#38383A',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
    inputBg: '#2C2C2E',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  typography: {
    hero: 32,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 11,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
  },
};

// ─── Global StyleSheet ────────────────────────────────────────
// Shared layout primitives. Individual screens still own their own styles
// but should pull from theme tokens for colors, spacing, radii.
export const createGlobalStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  text: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  textSecondary: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: theme.typography.h1,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...(theme.shadow.sm as any),
  },
});