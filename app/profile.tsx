import AuthForm from "@/components/ui/AuthForm";
import ProfileView from "@/components/ui/ProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const router = useRouter();

  const {
    user,
    profileData,
    isAuthenticated,
    isLoading,
    setProfileData,
    refreshUserData,
  } = useAuth();

  const { signUp, login, logout, loading: authLoading } = useAuthActions();

  // ✅ only redirect when user just logged in/sign up from this screen
  const shouldRedirectAfterAuth = useRef(false);

  const handleLogin = async (email: string, password: string) => {
    shouldRedirectAfterAuth.current = true;

    const result = await login(email, password);
    if (!result.success && result.error) {
      shouldRedirectAfterAuth.current = false;
      console.error("Login failed:", result.error);
      return;
    }

    // ✅ redirect to landing after successful login
    router.replace("/(tabs)");
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    shouldRedirectAfterAuth.current = true;

    const result = await signUp(email, password, name);
    if (!result.success && result.error) {
      shouldRedirectAfterAuth.current = false;
      console.error("Signup failed:", result.error);
      return;
    }

    // ✅ redirect to landing after successful signup
    router.replace("/(tabs)");
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success && result.error) {
      console.error("Logout failed:", result.error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header with back arrow */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isAuthenticated ? "Profile" : "Welcome"}
          </Text>

          <View style={styles.headerRightSpacer} />
          {isAuthenticated && <View style={styles.headerAccent} />}
        </View>

        <View style={styles.content}>
          {isAuthenticated ? (
            <ProfileView
              user={user}
              profileData={profileData}
              onUpdateProfile={setProfileData}
              onRefresh={refreshUserData}
              onLogout={handleLogout}
              loading={authLoading}
              accentColor="#DC2626"
              backgroundColor="#FEF2F2"
            />
          ) : (
            <AuthForm
              onLogin={handleLogin}
              onSignup={handleSignUp}
              loading={authLoading}
              accentColor="#DC2626"
              backgroundColor="#FEF2F2"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 44,
    height: 44,
  },
  headerAccent: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 3,
    backgroundColor: "#DC2626",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
});