import { Text, TouchableOpacity, ViewStyle } from "react-native";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  fullWidth = false,
  disabled = false,
  icon,
  style,
}) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: theme.colors.primary,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: theme.radii.md,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          opacity: disabled ? 0.6 : 1,
          ...(fullWidth ? { width: "100%" } : {}),
        } as ViewStyle,
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          color: theme.colors.white,
          fontSize: theme.typography.body,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
