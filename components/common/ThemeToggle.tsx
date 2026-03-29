import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { TouchableOpacity, Text } from "react-native";

const DarkModeButton: React.FC = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: isDark ? theme.colors.surfaceAlt : theme.colors.surface,
        alignSelf: "flex-end",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: theme.radii.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      activeOpacity={0.7}
      onPress={toggleTheme}
    >
      <Text style={{ color: theme.colors.text, fontSize: 16 }}>
        {isDark ? "☀️" : "🌙"}
      </Text>
    </TouchableOpacity>
  );
};

export default DarkModeButton;