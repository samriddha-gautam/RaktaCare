import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  // const [photoUri, setPhotoUri] = useState<string | null>(null);

  const dynamicStyles = StyleSheet.create({
    accentButton: { backgroundColor: accentColor },
    lightBackground: { backgroundColor: backgroundColor },
    accentText: { color: accentColor },
    inputFocused: { borderColor: accentColor },
  });

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

  const handleLogin = async () => {
    if (!validateInputs()) return;
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;
    try {
      await onSignup(email.trim(), password, name.trim());
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearForm();
  };

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.headerSubtitle}>
                {isLoginMode
                  ? "Sign in to your account"
                  : "Fill in your details to get started"}
              </Text>
            </View>

            <View style={styles.form}>
              {!isLoginMode && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={[styles.input, dynamicStyles.inputFocused]}
                    placeholder="Enter your full name"
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, dynamicStyles.inputFocused]}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, dynamicStyles.inputFocused]}
                  placeholder="Enter your password"
                  secureTextEntry
                  editable={!loading}
                  autoComplete="password"
                />
                {!isLoginMode && (
                  <Text style={styles.passwordHint}>
                    Password must be at least 6 characters
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={isLoginMode ? handleLogin : handleSignup}
                style={[styles.primaryButton, dynamicStyles.accentButton]}
                disabled={loading}
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
                <Text style={styles.toggleText}>
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
    backgroundColor: "#FFFFFF",
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
    color: "#6B7280",
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  photoSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginVertical: 10,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC2626',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  photoPlaceholderText: {
    fontSize: 30,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  passwordHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: "#6B7280",
  },
  toggleLink: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 50,
  },
});