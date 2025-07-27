import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const profile = () => {
  const { theme } = useTheme();
  const gStyles = createGlobalStyles(theme);

  return (
    <SafeAreaView
      style={[gStyles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={gStyles.screenPadding}>
        <Text style={gStyles.title}>Profile</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder="Username"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
          />
        </View>

        <ThemeToggle />
      </ScrollView>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 16,
  },
  textInput: {
    borderWidth: 2,
    marginHorizontal: 10,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});
