
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../styles/globalStyles';
import { useAppStore } from '../stores/appStore';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme(); 
  const { isDarkMode, setDarkMode } = useAppStore();

  const isDark = isDarkMode !== null ? isDarkMode : (systemColorScheme === 'light');
  
  const theme = isDark ? darkTheme : lightTheme;
  /**
   * Toggle theme
   */
  const toggleTheme = () => {
    setDarkMode(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};