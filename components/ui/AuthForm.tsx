import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import {
  Alert,
  Image, // Add this line
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
  onSignup: (email: string, password: string, name: string, photoUri?: string) => Promise<void>; // Add photoUri parameter
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

/*
Handles user signup process
Validates form inputs, then calls the parent component's onSignup function
with user data including optional profile photo

@async
@function handleSignup
@returns {Promise<void>}

Flow:
1. Validates all required inputs (email, password, name)
2. Calls parent's onSignup with: email, password, name, and optional photoUri
3. Parent component handles actual Firebase auth + photo upload
4. Errors are logged and should be handled by parent component
*/
const handleSignup = async () => {
  if (!validateInputs()) return;
  try {
    await onSignup(email.trim(), password, name.trim(), photoUri || undefined);
  } catch (error) {
    console.error("Signup error:", error);
  }
};

const clearForm = () => {
  setEmail("");
  setPassword("");
  setName("");
  setPhotoUri(null);
}

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearForm();
  };

  // Add these photo-related functions
  const requestPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos.');
    return false;
  }
  return true;
};

const selectPhoto = async () => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  Alert.alert(
    "Select Photo",
    "Choose how you'd like to add your profile photo",
    [
      { text: "Camera", onPress: openCamera },
      { text: "Photo Library", onPress: openImageLibrary },
      { text: "Cancel", style: "cancel" },
    ]
  );
};

const openCamera = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Sorry, we need camera permissions.');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    setPhotoUri(result.assets[0].uri);
  }
};

const openImageLibrary = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    setPhotoUri(result.assets[0].uri);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.content}>
            {/* Header */}
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

            {/* Form */}
            <View style={styles.form}>
                  {/* Photo Upload (only for signup) */}
  {!isLoginMode && (
    <View style={styles.photoSection}>
      <Text style={styles.inputLabel}>Profile Photo (Optional)</Text>
      
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
          <TouchableOpacity
            onPress={() => setPhotoUri(null)}
            style={styles.removePhotoButton}
          >
            <Text style={styles.removePhotoText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={selectPhoto}
          style={[styles.photoPlaceholder, dynamicStyles.inputFocused]}
          disabled={loading}
        >
          <Text style={styles.photoPlaceholderText}>📷</Text>
          <Text style={styles.photoPlaceholderSubtext}>Add Photo</Text>
        </TouchableOpacity>
      )}
      
      {photoUri && (
        <TouchableOpacity onPress={selectPhoto} disabled={loading}>
          <Text style={[styles.changePhotoText, dynamicStyles.accentText]}>
            Change Photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )}
              {/* Name Input (only for signup) */}
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

              {/* Email Input */}
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

              {/* Password Input */}
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

              {/* Primary Action Button */}
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

              {/* Mode Toggle */}
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
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // keyboardView: {
  //   flex: 1,
  // },
  content: {
    flex: 1,
    padding: 20,
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

  photoSection: {
  marginBottom: 20,
  alignItems: 'center',
},
photoContainer: {
  position: 'relative',
  marginBottom: 8,
},
profilePhoto: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 3,
  borderColor: '#E5E7EB',
},
removePhotoButton: {
  position: 'absolute',
  top: -5,
  right: -5,
  backgroundColor: '#DC2626',
  width: 25,
  height: 25,
  borderRadius: 12.5,
  justifyContent: 'center',
  alignItems: 'center',
},
removePhotoText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 'bold',
},
photoPlaceholder: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 2,
  borderStyle: 'dashed',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F9FAFB',
  marginBottom: 8,
},
photoPlaceholderText: {
  fontSize: 24,
  marginBottom: 4,
},
photoPlaceholderSubtext: {
  fontSize: 12,
  color: '#6B7280',
},
changePhotoText: {
  fontSize: 14,
  fontWeight: '500',
  textAlign: 'center',
},
});

export default AuthForm;
