import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Not logged in", "Please login first.");
      return;
    }

    const email = user.email;
    if (!email) {
      Alert.alert(
        "Not supported",
        "This account has no email attached, so password change is not available."
      );
      return;
    }

    if (!currentPassword) {
      Alert.alert("Missing", "Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Invalid", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Invalid",
        "New password must be different from current password."
      );
      return;
    }

    try {
      setLoading(true);

      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      Alert.alert("Success", "Your password has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.log("change password error:", e);

      const code = e?.code as string | undefined;

      if (code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect.");
        return;
      }

      if (code === "auth/too-many-requests") {
        Alert.alert("Try later", "Too many attempts. Please try again later.");
        return;
      }

      if (code === "auth/requires-recent-login") {
        Alert.alert(
          "Login required",
          "For security reasons, please log in again and then change your password."
        );
        return;
      }

      Alert.alert("Error", e?.message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={g.container}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Change Password
        </Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          Enter your current password and choose a new one for your security.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Current Password
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Enter current password"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            New Password
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Min 6 characters"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Confirm New Password
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Re-enter new password"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.8}
          style={[
            styles.btn,
            {
              backgroundColor: theme.colors.primary,
              opacity: loading ? 0.7 : 1,
              ...(theme.shadow.md as any),
            },
          ]}
        >
          {loading ? (
             <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={[styles.btnText, { color: theme.colors.white }]}>
               Update Password
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  back: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "bold" },
  sub: { marginTop: 4, marginBottom: 28, fontSize: 14, lineHeight: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  btn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { fontWeight: "700", fontSize: 16 },
});