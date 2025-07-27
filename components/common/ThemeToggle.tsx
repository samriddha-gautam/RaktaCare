import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { TouchableOpacity, Text } from "react-native";

const DarkModeButton: React.FC = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: isDark ? theme.colors.surface : "#ffffff",
        alignSelf: "flex-end",
        padding: 4,
        margin: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      activeOpacity={0.8}
      onPress={toggleTheme}
    >
      <Text style={{ color: theme.colors.text }}>
        {isDark ? "☀️" : "🌙"}
      </Text>
    </TouchableOpacity>
  );
};

export default DarkModeButton;