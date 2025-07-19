import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';


const DarkModeButton: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme}>
      <Text>
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </Text>
    </TouchableOpacity>
  );
};

export default DarkModeButton;