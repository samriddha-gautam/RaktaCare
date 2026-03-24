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

      // ✅ Firebase requires recent login for sensitive operations
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Change Password
        </Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          Enter your current password and choose a new one.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
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
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
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
            placeholder="Enter new password (min 6 chars)"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
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
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.9}
          style={[
            styles.btn,
            {
              backgroundColor: theme.colors.primary,
              opacity: loading ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.btnText}>
            {loading ? "Updating..." : "Update Password"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  back: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "900" },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});