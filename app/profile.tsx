import AuthForm from "@/components/ui/AuthForm";
import ProfileView from "@/components/ui/ProfileView";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/contexts/ThemeContext";
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

  /**
 *  profile
 */
const Profile = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const {
    user,
    profileData,
    isAuthenticated,
    isLoading,
    setProfileData,
    refreshUserData,
  } = useAuthStore();

  const { signUp, login, logout, loading: authLoading } = useAuthActions();

  //  only redirect when user just logged in/sign up from this screen
  const shouldRedirectAfterAuth = useRef(false);

  /**
   * Handle login
   */
  const handleLogin = async (email: string, password: string) => {
    shouldRedirectAfterAuth.current = true;

    const result = await login(email, password);
    
    
    if (!result.success && result.error) {
      shouldRedirectAfterAuth.current = false;
      console.error("Login failed:", result.error);
      return;
    }

    //  redirect to landing after successful login
    router.replace("/(tabs)");
  };

  /**
   * Handle sign up
   */
  const handleSignUp = async (email: string, password: string, name: string) => {
    shouldRedirectAfterAuth.current = true;

    const result = await signUp(email, password, name);
    
    
    if (!result.success && result.error) {
      shouldRedirectAfterAuth.current = false;
      console.error("Signup failed:", result.error);
      return;
    }

    //  redirect to landing after successful signup
    router.replace("/(tabs)");
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    const result = await logout();
    
    
    if (!result.success && result.error) {
      console.error("Logout failed:", result.error);
    }
  };

  
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header with back arrow */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {isAuthenticated ? "Profile" : "Welcome"}
          </Text>

          <View style={styles.headerRightSpacer} />
          {isAuthenticated && (
            <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>

        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          {isAuthenticated ? (
            <ProfileView
              user={user}
              profileData={profileData}
              onUpdateProfile={setProfileData}
              onRefresh={refreshUserData}
              onLogout={handleLogout}
              loading={authLoading}
              accentColor={theme.colors.primary}
              backgroundColor={theme.colors.primaryLight}
            />
          ) : (
            <AuthForm
              onLogin={handleLogin}
              onSignup={handleSignUp}
              loading={authLoading}
              accentColor={theme.colors.primary}
              backgroundColor={theme.colors.primaryLight}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
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
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});