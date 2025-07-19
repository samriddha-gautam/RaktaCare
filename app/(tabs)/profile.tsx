import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  ScrollView,
} from "react-native";
import React from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useTheme } from "@/contexts/ThemeContext";

const profile = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  return (
    <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={globalStyles.screenPadding}>
        <Text style={globalStyles.title}>Profile</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              }
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