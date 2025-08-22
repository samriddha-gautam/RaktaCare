import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthActions } from "@/hooks/useAuthActions";
import ProfileView from "@/components/ui/ProfileView";
import AuthForm from "@/components/ui/AuthForm";

const Profile = () => {
  const {
    user,
    profileData,
    isAuthenticated,
    isLoading,
    setProfileData,
    refreshUserData,
  } = useAuth();

  const { signUp, login, logout, loading: authLoading } = useAuthActions();

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (!result.success && result.error) {
      console.error("Login failed:", result.error);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name: string
  ) => {
    const result = await signUp(email, password, name);
    if (!result.success && result.error) {
      console.error("Signup failed:", result.error);
    }
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isAuthenticated ? "Profile" : "Welcome"}
          </Text>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
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
