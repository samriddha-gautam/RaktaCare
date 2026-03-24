import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

const DONATION_TYPES = [
  { label: "Whole Blood", days: 56 },
  { label: "Double Red Cells", days: 112 },
  { label: "Platelets", days: 7 },
  { label: "Plasma", days: 28 },
];

const REMINDER_TIMES = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "12:00 PM",
  "3:00 PM",
  "6:00 PM",
  "8:00 PM",
];

const DonationReminders: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();

  const [selectedType, setSelectedType] = useState(0);
  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [lastDonationDate, setLastDonationDate] = useState<Date | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("donationReminderSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        setSelectedType(settings.selectedType ?? 0);
        setSelectedTime(settings.selectedTime ?? "9:00 AM");
        setPushEnabled(settings.pushEnabled ?? true);
        setEmailEnabled(settings.emailEnabled ?? false);
        if (settings.lastDonationDate) {
          setLastDonationDate(new Date(settings.lastDonationDate));
        }
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        selectedType,
        selectedTime,
        pushEnabled,
        emailEnabled,
        lastDonationDate: lastDonationDate?.toISOString() ?? null,
      };
      await AsyncStorage.setItem(
        "donationReminderSettings",
        JSON.stringify(settings)
      );
      Alert.alert(
        "✅ Saved",
        "Your donation reminder settings have been updated."
      );
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  };

  const getNextDonationDate = (): string => {
    if (!lastDonationDate) return "Set your last donation date";
    const next = new Date(lastDonationDate);
    next.setDate(next.getDate() + DONATION_TYPES[selectedType].days);
    const now = new Date();
    if (next <= now) return "You are eligible to donate now! 🎉";
    return next.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilEligible = (): number | null => {
    if (!lastDonationDate) return null;
    const next = new Date(lastDonationDate);
    next.setDate(next.getDate() + DONATION_TYPES[selectedType].days);
    const now = new Date();
    const diff = Math.ceil(
      (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  const setLastDonationToday = () => {
    setLastDonationDate(new Date());
  };

  const daysLeft = getDaysUntilEligible();

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Donation Reminders
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Stay on track with your blood donation schedule
        </Text>

        {/* Next Donation Preview Card */}
        <View
          style={[styles.previewCard, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.previewLabel}>Next Eligible Donation</Text>
          <Text style={styles.previewDate}>{getNextDonationDate()}</Text>
          {daysLeft !== null && daysLeft > 0 && (
            <View style={styles.daysLeftBadge}>
              <Text style={styles.daysLeftText}>{daysLeft} days to go</Text>
            </View>
          )}
        </View>

        {/* Donation Type Selection */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Donation Type
          </Text>
          {DONATION_TYPES.map((type, index) => (
            <TouchableOpacity
              key={type.label}
              style={[
                styles.optionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                  ...(selectedType === index && {
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.primary,
                  }),
                },
              ]}
              onPress={() => setSelectedType(index)}
            >
              <View>
                <Text
                  style={[styles.optionLabel, { color: theme.colors.text }]}
                >
                  {type.label}
                </Text>
                <Text
                  style={[
                    styles.optionSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Every {type.days} days
                </Text>
              </View>
              {selectedType === index && (
                <Text style={{ color: theme.colors.primary, fontSize: 20 }}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Last Donation Date */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Last Donation Date
          </Text>
          <View
            style={[
              styles.dateContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {lastDonationDate
                ? lastDonationDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not set"}
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={setLastDonationToday}
            >
              <Text style={styles.dateButtonText}>I Donated Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reminder Time */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Reminder Time
          </Text>
          <TouchableOpacity
            style={[
              styles.timeSelector,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Text
              style={[styles.timeSelectorLabel, { color: theme.colors.text }]}
            >
              Remind me at
            </Text>
            <Text
              style={[
                styles.timeSelectorValue,
                { color: theme.colors.primary },
              ]}
            >
              {selectedTime} ▾
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <View
              style={[
                styles.timePickerContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {REMINDER_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    {
                      borderBottomColor: theme.colors.border,
                      ...(selectedTime === time && {
                        backgroundColor: theme.colors.primary + "20",
                      }),
                    },
                  ]}
                  onPress={() => {
                    setSelectedTime(time);
                    setShowTimePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color:
                          selectedTime === time
                            ? theme.colors.primary
                            : theme.colors.text,
                        fontWeight: selectedTime === time ? "700" : "400",
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notification Methods */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Notification Methods
          </Text>
          <View
            style={[
              styles.switchItem,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View>
              <Text
                style={[styles.switchLabel, { color: theme.colors.text }]}
              >
                Push Notifications
              </Text>
              <Text
                style={[
                  styles.switchSub,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Get notified on your device
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={pushEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
          <View
            style={[
              styles.switchItem,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View>
              <Text
                style={[styles.switchLabel, { color: theme.colors.text }]}
              >
                Email Reminders
              </Text>
              <Text
                style={[
                  styles.switchSub,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Receive email before your next eligible date
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={emailEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>Save Reminder Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { fontSize: 16, fontWeight: "600" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
  },
  previewCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    alignItems: "center",
  },
  previewLabel: {
    color: "#ffffffbb",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewDate: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  daysLeftBadge: {
    marginTop: 12,
    backgroundColor: "#ffffff33",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  daysLeftText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionLabel: { fontSize: 16, fontWeight: "500" },
  optionSub: { fontSize: 12, marginTop: 2 },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dateText: { fontSize: 16, fontWeight: "500" },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dateButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  timeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  timeSelectorLabel: { fontSize: 16, fontWeight: "500" },
  timeSelectorValue: { fontSize: 16, fontWeight: "600" },
  timePickerContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  timeOptionText: { fontSize: 15 },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  switchLabel: { fontSize: 16, fontWeight: "500" },
  switchSub: { fontSize: 12, marginTop: 2 },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default DonationReminders;