import Button from "@/components/common/Button";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [donationReminders, setDonationReminders] = React.useState(false);
  const [locationServices, setLocationServices] = React.useState(false);

  const loadFlags = React.useCallback(async () => {
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
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFlags();
    }, [loadFlags])
  );

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
         {children}
      </View>
    </View>
  );

  const SettingItem = ({
    label,
    value,
    onValueChange,
    showSwitch = false,
    isFirst = false,
    isLast = false,
    onPress,
  }: {
    label: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showSwitch?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    onPress?: () => void;
  }) => {
    const content = (
        <View
          style={[
            styles.settingItem,
            {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: isLast ? 0 : 1,
            },
          ]}
        >
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
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
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              ›
            </Text>
          )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }
    return content;
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    // If turning off master notifications, also turn off dependent reminders
    if (!value) {
      setDonationReminders(false);
    }

    try {
      const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      
      const next = {
        ...parsed,
        notificationsEnabled: value,
        // If master is off, sub-settings should also be disabled in storage
        ...(value === false ? {
          emergencyRequestsEnabled: false,
          donationRemindersEnabled: false,
        } : {}),
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
    setLocationServices(value);

    try {
      const raw = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = { ...parsed, locationEnabled: value };
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          Settings
        </Text>

        <SettingSection title="Appearance">
          <View
            style={[
              styles.settingItem,
              { borderBottomWidth: 0 },
            ]}
          >
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Dark Mode
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
            isFirst={true}
          />
          <SettingItem
            label="Donation Reminders"
            value={donationReminders}
            onValueChange={handleToggleDonationReminders}
            showSwitch={true}
          />
          <SettingItem 
            label="Notification Preferences" 
            onPress={() => router.push("/notification-preferences")}
            isLast={true}
          />
        </SettingSection>

        <SettingSection title="Privacy & Location">
          <SettingItem
            label="Location Services"
            value={locationServices}
            onValueChange={handleToggleLocationServices}
            showSwitch={true}
            isFirst={true}
          />
          <SettingItem 
            label="Privacy Policy" 
            onPress={() => router.push("/privacy-policy")}
            isLast={true}
          />
        </SettingSection>

        <SettingSection title="Donation Profile">
          <SettingItem 
            label="Eligibility Criteria" 
            onPress={() => router.push("/eligibility-settings")}
            isFirst={true}
            isLast={true}
          />
        </SettingSection>

        <SettingSection title="Account">
          <SettingItem 
            label="Edit Profile" 
            onPress={() => router.push("/edit-profile")}
            isFirst={true}
          />
          <SettingItem 
            label="Change Password" 
            onPress={() => router.push("/change-password")}
            isLast={true}
          />
        </SettingSection>

        <View style={styles.dangerZone}>
          <Button
            title={authLoading ? "Logging out..." : "Log Out"}
            onPress={handleLogout}
            disabled={authLoading}
            fullWidth
          />
        </View>

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>
          Version 1.0.0 · RaktaCare
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 10,
    opacity: 0.8,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingValue: { fontSize: 20, fontWeight: "300" },
  dangerZone: { marginHorizontal: 20, marginTop: 40, marginBottom: 20 },
  version: { textAlign: "center", fontSize: 12, marginBottom: 32 },
});

export default Settings;