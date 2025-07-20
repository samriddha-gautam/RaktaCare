// styles/globalStyles.ts
import { StyleSheet } from 'react-native';

// Define theme types
export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow:string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Light theme
export const lightTheme: Theme = {
  colors: {
    background: '#ffffff',
    surface: '#f8f9fa',
    primary: '#FF6B6B',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e1e8ed',
    shadow:'#000000'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// Dark theme
export const darkTheme: Theme = {
  colors: {
    background: '#000000',
    surface: '#1c1c1e',
    primary: '#FF6B6B',
    text: '#c4bfbfff',
    textSecondary: '#8e8e93',
    border: '#38383a',
    shadow:'#ffffff'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// Create styles function that accepts theme
export const createGlobalStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: theme.colors.background,
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  screenPadding: {
    paddingTop: theme.spacing.md,
    marginTop:theme.spacing.xl
  },
  text: {
    fontSize: 20,
    color: theme.colors.text,
  },
  textSecondary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor:theme.colors.shadow,
  },
});