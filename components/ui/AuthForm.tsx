import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string, photoUri?: string) => Promise<void>;
  loading?: boolean;
  accentColor?: string;
  backgroundColor?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onLogin,
  onSignup,
  loading = false,
  accentColor = "#DC2626",
  backgroundColor = "#FEF2F2",
}) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    accentButton: { backgroundColor: accentColor },
    lightBackground: { backgroundColor: backgroundColor },
    accentText: { color: accentColor },
    inputFocused: { borderColor: accentColor },
    inputContainer: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
        color: theme.colors.text,
    },
    containerBg: { backgroundColor: theme.colors.background },
    placeholderColor: { color: theme.colors.textMuted },
    textPrimary: { color: theme.colors.text },
    textSecondary: { color: theme.colors.textSecondary },
  }), [accentColor, backgroundColor, theme]);

  /**
   * Validate inputs
   */
  const validateInputs = () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter your password");
      return false;
    }
    if (!isLoginMode && !name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return false;
    }
    
    
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  /**
   * Handle login
   */
  const handleLogin = async () => {
    if (!validateInputs()) return;
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  /**
   * Handle signup
   */
  const handleSignup = async () => {
    if (!validateInputs()) return;
    try {
      await onSignup(email.trim(), password, name.trim());
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  /**
   * Clear form
   */
  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  /**
   * Toggle mode
   */
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearForm();
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.containerBg]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.content}>
            <View style={[styles.header, dynamicStyles.lightBackground]}>
              <Text style={[styles.headerTitle, dynamicStyles.accentText]}>
                {isLoginMode ? "Welcome Back!" : "Create Account"}
              </Text>
              <Text style={[styles.headerSubtitle, dynamicStyles.textSecondary]}>
                {isLoginMode
                  ? "Sign in to your account"
                  : "Fill in your details to get started"}
              </Text>
            </View>

            <View style={styles.form}>
              {!isLoginMode && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={[styles.input, dynamicStyles.inputContainer]}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, dynamicStyles.inputContainer]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, dynamicStyles.inputContainer]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                  autoComplete="password"
                />
                {!isLoginMode && (
                  <Text style={[styles.passwordHint, dynamicStyles.textSecondary]}>
                    Password must be at least 6 characters
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={isLoginMode ? handleLogin : handleSignup}
                style={[styles.primaryButton, dynamicStyles.accentButton, (theme.shadow.md as any)]}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {loading
                    ? isLoginMode
                      ? "Signing In..."
                      : "Creating Account..."
                    : isLoginMode
                    ? "Sign In"
                    : "Create Account"}
                </Text>
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleText, dynamicStyles.textSecondary]}>
                  {isLoginMode
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleMode} disabled={loading}>
                  <Text style={[styles.toggleLink, dynamicStyles.accentText]}>
                    {isLoginMode ? "Sign Up" : "Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  content: {
    flex: 1,
    padding: 20,
    minHeight: '100%',
  },
  header: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 16,
  },
  toggleLink: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 50,
  },
});