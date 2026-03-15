import Button from "@/components/common/Button";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

const NOTIF_PREFS_KEY = "notificationPreferences";
const LOCATION_SETTINGS_KEY = "locationSettings";

async function readStoredFlag(key: string, field: string, fallback: boolean) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const val = parsed?.[field];
    return typeof val === "boolean" ? val : fallback;
  } catch {
    return fallback;
  }
}

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();

  const { logout, loading: authLoading } = useAuthActions();

  // ✅ Do NOT default push notifications ON.
  // We default OFF in UI until we read the real stored prefs.
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [donationReminders, setDonationReminders] = React.useState(false);
  const [locationServices, setLocationServices] = React.useState(false);

  useEffect(() => {
    (async () => {
      // If nothing stored yet, keep them OFF (false)
      const notifEnabled = await readStoredFlag(
        NOTIF_PREFS_KEY,
        "notificationsEnabled",
        false
      );
      const remindersEnabled = await readStoredFlag(
        NOTIF_PREFS_KEY,
        "donationRemindersEnabled",
        false
      );
      const locEnabled = await readStoredFlag(
        LOCATION_SETTINGS_KEY,
        "locationEnabled",
        false
      );

      setNotificationsEnabled(notifEnabled);
      setDonationReminders(remindersEnabled);
      setLocationServices(locEnabled);
    })();
  }, []);

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={localStyles.section}>
      <Text style={[localStyles.sectionTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingItem = ({
    label,
    value,
    onValueChange,
    showSwitch = false,
  }: {
    label: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showSwitch?: boolean;
  }) => (
    <View
      style={[
        localStyles.settingItem,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[localStyles.settingLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={value ? "#fff" : "#f4f3f4"}
        />
      ) : (
        <Text style={[localStyles.settingValue, { color: theme.colors.textSecondary }]}>
          ›
        </Text>
      )}
    </View>
  );

  const handleToggleNotifications = async (value: boolean) => {
    // UX: if user wants to enable, send them to Notification Preferences
    // (where you can request permission / register token etc.)
    if (value) {
      router.push("/notification-preferences");
      return;
    }

    // Turning OFF: persist locally
    setNotificationsEnabled(false);
    setDonationReminders(false);

    try {
      const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = {
        ...parsed,
        notificationsEnabled: false,
        emergencyRequestsEnabled: false,
        donationRemindersEnabled: false,
        lastUpdatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("Failed to persist notificationsEnabled", e);
    }
  };

  const handleToggleDonationReminders = async (value: boolean) => {
    if (!notificationsEnabled && value) {
      Alert.alert("Enable Notifications", "Turn on push notifications first.");
      return;
    }

    setDonationReminders(value);

    try {
      const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = {
        ...parsed,
        donationRemindersEnabled: value,
        lastUpdatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("Failed to persist donationRemindersEnabled", e);
    }
  };

  const handleToggleLocationServices = async (value: boolean) => {
    if (value) {
      router.push("/location-services");
      return;
    }

    setLocationServices(false);

    try {
      const raw = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = { ...parsed, locationEnabled: false };
      await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("Failed to persist locationEnabled", e);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          const res = await logout();
          if (res.success) {
            router.replace("/profile");
          } else {
            Alert.alert("Error", res.error || "Failed to log out.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={localStyles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[localStyles.header, { color: theme.colors.text }]}>
          Settings
        </Text>

        <SettingSection title="Appearance">
          <View
            style={[
              localStyles.settingItem,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[localStyles.settingLabel, { color: theme.colors.text }]}>
              Theme
            </Text>
            <ThemeToggle />
          </View>
        </SettingSection>

        <SettingSection title="Notifications">
          <SettingItem
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            showSwitch={true}
          />

          <SettingItem
            label="Donation Reminders"
            value={donationReminders}
            onValueChange={handleToggleDonationReminders}
            showSwitch={true}
          />

          {donationReminders && (
            <TouchableOpacity onPress={() => router.push("/donation-reminders")}>
              <View
                style={[
                  localStyles.settingItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[localStyles.settingLabel, { color: theme.colors.primary }]}>
                  ⚙️ Configure Donation Reminders
                </Text>
                <Text style={[localStyles.settingValue, { color: theme.colors.textSecondary }]}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.push("/notification-preferences")}>
            <SettingItem label="Notification Preferences" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Privacy & Location">
          <SettingItem
            label="Location Services"
            value={locationServices}
            onValueChange={handleToggleLocationServices}
            showSwitch={true}
          />

          {locationServices && (
            <TouchableOpacity onPress={() => router.push("/location-services")}>
              <View
                style={[
                  localStyles.settingItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[localStyles.settingLabel, { color: theme.colors.primary }]}>
                  📍 Configure Location Services
                </Text>
                <Text style={[localStyles.settingValue, { color: theme.colors.textSecondary }]}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
            <SettingItem label="Privacy Policy" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Donation Profile">
          <TouchableOpacity onPress={() => router.push("/eligibility-settings")}>
            <SettingItem label="Eligibility" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Account">
          <TouchableOpacity onPress={() => router.push("/edit-profile")}>
            <SettingItem label="Edit Profile" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/change-password")}>
            <SettingItem label="Change Password" />
          </TouchableOpacity>
        </SettingSection>

        <View style={localStyles.dangerZone}>
          <Button
            title={authLoading ? "Logging out..." : "Log Out"}
            onPress={handleLogout}
            disabled={authLoading}
          />
        </View>

        <Text style={[localStyles.version, { color: theme.colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingValue: { fontSize: 20, fontWeight: "300" },
  dangerZone: { marginHorizontal: 20, marginTop: 32, marginBottom: 16 },
  version: { textAlign: "center", fontSize: 12, marginBottom: 32 },
});

export default Settings;