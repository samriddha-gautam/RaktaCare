import { Text, TouchableOpacity,ViewStyle } from "react-native";
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
}) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        backgroundColor: theme.colors.primary,
        padding: 10,
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        
      }}
    >
      {icon}
      <Text
        style={{
          color: theme.colors.text,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
