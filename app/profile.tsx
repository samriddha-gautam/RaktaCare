import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useProfile } from "@/hooks/useProfile";
import ProfileView from "@/components/ui/ProfileView";
import AuthForm from "@/components/ui/AuthForm";

const profile = () => {
  const { user } = useAuth();
  const { signUp, login, logout, loading: authLoading } = useAuthActions();
  const { profileData, loading: profileLoading } = useProfile();
  return (
    <SafeAreaView>
      <View>
        {user ? (
          <ProfileView
            profileData={profileData}
            onLogout={logout}
            loading={authLoading || profileLoading}
          />
        ) : (
          <AuthForm 
            onLogin={login} 
            onSignup={signUp} 
            loading={authLoading}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({});
