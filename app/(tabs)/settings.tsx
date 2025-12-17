import Button from "@/components/common/Button";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [donationReminders, setDonationReminders] = React.useState(true);
  const [locationServices, setLocationServices] = React.useState(false);

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={localStyles.section}>
      <Text
        style={[
          localStyles.sectionTitle,
          { color: theme.colors.textSecondary },
        ]}
      >
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
      {showSwitch && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={value ? "#fff" : "#f4f3f4"}
        />
      )}
      {!showSwitch && (
        <Text
          style={[
            localStyles.settingValue,
            { color: theme.colors.textSecondary },
          ]}
        >
          ›
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={localStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
            <Text
              style={[localStyles.settingLabel, { color: theme.colors.text }]}
            >
              Theme
            </Text>
            <ThemeToggle />
          </View>
        </SettingSection>

        <SettingSection title="Notifications">
          <SettingItem
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            showSwitch={true}
          />
          <SettingItem
            label="Donation Reminders"
            value={donationReminders}
            onValueChange={setDonationReminders}
            showSwitch={true}
          />
          <TouchableOpacity>
            <SettingItem label="Notification Preferences" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Privacy & Location">
          <SettingItem
            label="Location Services"
            value={locationServices}
            onValueChange={setLocationServices}
            showSwitch={true}
          />
          <TouchableOpacity>
            <SettingItem label="Privacy Policy" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Data & Storage" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Donation Profile">
          <TouchableOpacity>
            <SettingItem label="Blood Type & Medical Info" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Donation History" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Eligibility Settings" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Account">
          <TouchableOpacity>
            <SettingItem label="Edit Profile" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Change Password" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Linked Accounts" />
          </TouchableOpacity>
        </SettingSection>

        <SettingSection title="Support">
          <TouchableOpacity>
            <SettingItem label="Help Center" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="Contact Support" />
          </TouchableOpacity>
          <TouchableOpacity>
            <SettingItem label="About" />
          </TouchableOpacity>
        </SettingSection>

        <View style={localStyles.dangerZone}>
          <Button
            title="Log Out"
            onPress={() => console.log("Log out pressed")}
          />
        </View>

        <Text
          style={[localStyles.version, { color: theme.colors.textSecondary }]}
        >
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
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
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 20,
    fontWeight: "300",
  },
  dangerZone: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 32,
  },
});

export default Settings;
