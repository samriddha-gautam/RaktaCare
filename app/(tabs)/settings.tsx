import Button from "@/components/common/Button";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

const settings: React.FC = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  return (
    <SafeAreaView style={[styles.container,{alignItems:'flex-start'}]}>
      <ThemeToggle />
      <Button
        title="Click Me"
        onPress={() => console.log("Button Pressed in settings")}
        style={{alignSelf:"center"}}
      />
    </SafeAreaView>
  );
};

export default settings;
