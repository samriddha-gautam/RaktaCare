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
  "9:00 PM",
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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
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
          style={[styles.previewCard, { backgroundColor: theme.colors.primary, ...(theme.shadow.md as any) }]}
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
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {DONATION_TYPES.map((type, index) => (
                <TouchableOpacity
                    key={type.label}
                    style={[
                        styles.optionItem,
                        {
                            borderBottomColor: theme.colors.border,
                            borderBottomWidth: index === DONATION_TYPES.length - 1 ? 0 : 1,
                        },
                    ]}
                    onPress={() => setSelectedType(index)}
                    activeOpacity={0.7}
                >
                    <View>
                        <Text
                            style={[
                                styles.optionLabel,
                                { color: selectedType === index ? theme.colors.primary : theme.colors.text }
                            ]}
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
        </View>

        {/* Date / Time Group */}
        <View style={styles.section}>
            <Text
                style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
            >
                Schedule Information
            </Text>
            <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                 {/* Last Donation Date Row */}
                 <View style={[styles.dateContainer, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Last Donation</Text>
                        <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>
                            {lastDonationDate
                                ? lastDonationDate.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })
                                : "Not set"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.dateButton,
                            { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={setLastDonationToday}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.dateButtonText}>I Donated Today</Text>
                    </TouchableOpacity>
                 </View>

                 {/* Reminder Time Row */}
                 <TouchableOpacity
                    style={[
                        styles.timeSelector,
                    ]}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                    activeOpacity={0.7}
                 >
                    <Text
                        style={[styles.optionLabel, { color: theme.colors.text }]}
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
            </View>

            {showTimePicker && (
            <View
              style={[
                styles.timePickerContainer,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              {REMINDER_TIMES.map((time, i) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: i === REMINDER_TIMES.length - 1 ? 0 : 1,
                      backgroundColor: selectedTime === time ? theme.colors.primary + "15" : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setSelectedTime(time);
                    setShowTimePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color:
                          selectedTime === time
                            ? theme.colors.primary
                            : theme.colors.text,
                        fontWeight: selectedTime === time ? "700" : "500",
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

        {/* Notifications Group */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Notification Methods
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View
                style={[
                styles.switchItem,
                { borderBottomColor: theme.colors.border, borderBottomWidth: 1 },
                ]}
            >
                <View>
                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Push Notifications</Text>
                    <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>
                        Get notified on this device
                    </Text>
                </View>
                <Switch
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={pushEnabled ? "#fff" : "#f4f3f4"}
                />
            </View>
            <View style={styles.switchItem}>
                <View>
                    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Email Reminders</Text>
                    <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>
                        Receive email reminders
                    </Text>
                </View>
                <Switch
                    value={emailEnabled}
                    onValueChange={setEmailEnabled}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={emailEnabled ? "#fff" : "#f4f3f4"}
                />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary, ...(theme.shadow.md as any) }]}
          onPress={saveSettings}
          activeOpacity={0.8}
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
  backText: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },

  previewCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    alignItems: "center",
  },
  previewLabel: { color: "#ffffffcc", fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  previewDate: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 8, textAlign: "center" },
  daysLeftBadge: { marginTop: 14, backgroundColor: "#ffffff33", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  daysLeftText: { color: "#fff", fontSize: 14, fontWeight: "700" },

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
  groupCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLabel: { fontSize: 16, fontWeight: "600" },
  optionSub: { fontSize: 13, marginTop: 2, opacity: 0.8 },

  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  dateButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  timeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  timeSelectorValue: { fontSize: 16, fontWeight: "700" },
  
  timePickerContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  timeOption: { paddingVertical: 12, paddingHorizontal: 16 },
  timeOptionText: { fontSize: 15 },

  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  saveButton: { marginHorizontal: 20, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default DonationReminders;