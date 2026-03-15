import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type NotificationPreferences = {
  notificationsEnabled: boolean;
  emergencyRequestsEnabled: boolean;
  donationRemindersEnabled: boolean;

  // Donor matching preferences
  matchOnlyMyBloodGroup: boolean;
  maxDistanceKm: number;

  // Quiet hours (optional)
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"

  // Diagnostics
  lastUpdatedAt?: string;
};

const STORAGE_KEY = "notificationPreferences";

const DEFAULT_PREFS: NotificationPreferences = {
  notificationsEnabled: true,
  emergencyRequestsEnabled: true,
  donationRemindersEnabled: true,
  matchOnlyMyBloodGroup: true,
  maxDistanceKm: 10,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  lastUpdatedAt: undefined,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

export default function NotificationPreferencesScreen() {
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);
  const { isAuthenticated } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [distanceInput, setDistanceInput] = useState(
    String(DEFAULT_PREFS.maxDistanceKm)
  );

  const saveLocal = async (next: NotificationPreferences) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("Failed to save notification prefs", e);
    }
  };

  const saveRemote = async (next: NotificationPreferences) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          notificationPreferences: {
            notificationsEnabled: next.notificationsEnabled,
            emergencyRequestsEnabled: next.emergencyRequestsEnabled,
            donationRemindersEnabled: next.donationRemindersEnabled,
            matchOnlyMyBloodGroup: next.matchOnlyMyBloodGroup,
            maxDistanceKm: next.maxDistanceKm,
            quietHoursEnabled: next.quietHoursEnabled,
            quietHoursStart: next.quietHoursStart,
            quietHoursEnd: next.quietHoursEnd,
            lastUpdatedAt: next.lastUpdatedAt ?? new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.log("Failed to sync notification prefs to Firestore", e);
    }
  };

  const save = async (next: NotificationPreferences) => {
    const withMeta = { ...next, lastUpdatedAt: new Date().toISOString() };
    await saveLocal(withMeta);
    if (isAuthenticated) {
      await saveRemote(withMeta);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        const merged: NotificationPreferences = {
          ...DEFAULT_PREFS,
          ...parsed,
          maxDistanceKm: clamp(Number(parsed.maxDistanceKm ?? 10), 1, 200),
        };

        setPrefs(merged);
        setDistanceInput(String(merged.maxDistanceKm));
      } catch (e) {
        console.log("Failed to load notification prefs", e);
      }
    })();
  }, []);

  const statusCard = useMemo(() => {
    if (!isAuthenticated) {
      return {
        color: "#EF4444",
        title: "Login required",
        subtitle:
          "Login to sync notification preferences across devices and use real-time matching.",
        emoji: "🔒",
      };
    }

    if (!prefs.notificationsEnabled) {
      return {
        color: "#EF4444",
        title: "Notifications are OFF",
        subtitle:
          "Enable notifications to receive emergency requests and donation reminders.",
        emoji: "🔕",
      };
    }

    if (!prefs.emergencyRequestsEnabled && !prefs.donationRemindersEnabled) {
      return {
        color: "#F59E0B",
        title: "No alerts enabled",
        subtitle:
          "Turn on Emergency Requests or Donation Reminders to receive alerts.",
        emoji: "⚠️",
      };
    }

    return {
      color: "#22C55E",
      title: "Notifications are ON",
      subtitle: "Your preferences will be used for real-time donor matching.",
      emoji: "✅",
    };
  }, [
    isAuthenticated,
    prefs.notificationsEnabled,
    prefs.emergencyRequestsEnabled,
    prefs.donationRemindersEnabled,
  ]);

  const applyDistance = async () => {
    const parsed = Number(distanceInput);
    if (!Number.isFinite(parsed)) {
      Alert.alert("Invalid distance", "Enter a valid number (1 to 200).");
      setDistanceInput(String(prefs.maxDistanceKm));
      return;
    }
    const nextDist = clamp(Math.round(parsed), 1, 200);
    setDistanceInput(String(nextDist));
    await save({ ...prefs, maxDistanceKm: nextDist });
  };

  const setTime = async (key: "quietHoursStart" | "quietHoursEnd", value: string) => {
    const next = value.trim();
    if (!isValidTime(next)) {
      Alert.alert("Invalid time", 'Use HH:MM format, e.g. "22:00".');
      return;
    }
    await save({ ...prefs, [key]: next });
  };

  return (
    <SafeAreaView style={g.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Notification Preferences
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Control which alerts you receive and how donor matching works.
        </Text>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: statusCard.color + "15" },
          ]}
        >
          <Text style={styles.statusEmoji}>{statusCard.emoji}</Text>
          <Text style={[styles.statusTitle, { color: statusCard.color }]}>
            {statusCard.title}
          </Text>
          <Text
            style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}
          >
            {statusCard.subtitle}
          </Text>
        </View>

        {/* MASTER TOGGLE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            General
          </Text>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Enable Notifications
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                Master toggle for all alerts inside RaktaCare.
              </Text>
            </View>

            <Switch
              value={prefs.notificationsEnabled}
              onValueChange={(v) =>
                save({
                  ...prefs,
                  notificationsEnabled: v,
                  // If master off -> turn off all categories
                  emergencyRequestsEnabled: v ? prefs.emergencyRequestsEnabled : false,
                  donationRemindersEnabled: v ? prefs.donationRemindersEnabled : false,
                })
              }
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={prefs.notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Alert Types
          </Text>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Emergency Requests
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                Get notified when someone needs blood near you.
              </Text>
            </View>

            <Switch
              value={prefs.emergencyRequestsEnabled}
              onValueChange={(v) => {
                if (!prefs.notificationsEnabled && v) {
                  Alert.alert("Enable Notifications", "Turn on notifications first.");
                  return;
                }
                save({ ...prefs, emergencyRequestsEnabled: v });
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={prefs.emergencyRequestsEnabled ? "#fff" : "#f4f3f4"}
              disabled={!prefs.notificationsEnabled}
            />
          </View>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Donation Reminders
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                Reminders based on your donation schedule.
              </Text>
            </View>

            <Switch
              value={prefs.donationRemindersEnabled}
              onValueChange={(v) => {
                if (!prefs.notificationsEnabled && v) {
                  Alert.alert("Enable Notifications", "Turn on notifications first.");
                  return;
                }
                save({ ...prefs, donationRemindersEnabled: v });
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={prefs.donationRemindersEnabled ? "#fff" : "#f4f3f4"}
              disabled={!prefs.notificationsEnabled}
            />
          </View>
        </View>

        {/* MATCHING */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Matching
          </Text>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Only my blood group
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                If enabled, you will only get requests matching your donor blood group.
              </Text>
            </View>

            <Switch
              value={prefs.matchOnlyMyBloodGroup}
              onValueChange={(v) => save({ ...prefs, matchOnlyMyBloodGroup: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={prefs.matchOnlyMyBloodGroup ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View
            style={[
              styles.radiusRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.radiusLabel, { color: theme.colors.text }]}>
              Max distance (km)
            </Text>

            <TextInput
              value={distanceInput}
              onChangeText={setDistanceInput}
              placeholder="10"
              placeholderTextColor={theme.colors.textSecondary + "80"}
              keyboardType="numeric"
              style={[
                styles.radiusInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
              onBlur={applyDistance}
              returnKeyType="done"
              onSubmitEditing={applyDistance}
            />
          </View>
        </View>

        {/* QUIET HOURS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Quiet Hours
          </Text>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Enable Quiet Hours
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                Reduce interruptions during sleep or work.
              </Text>
            </View>

            <Switch
              value={prefs.quietHoursEnabled}
              onValueChange={(v) => save({ ...prefs, quietHoursEnabled: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={prefs.quietHoursEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                Start (HH:MM)
              </Text>
              <TextInput
                value={prefs.quietHoursStart}
                onChangeText={(t) => save({ ...prefs, quietHoursStart: t })}
                onBlur={() => setTime("quietHoursStart", prefs.quietHoursStart)}
                placeholder="22:00"
                placeholderTextColor={theme.colors.textSecondary + "80"}
                style={[
                  styles.timeInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                End (HH:MM)
              </Text>
              <TextInput
                value={prefs.quietHoursEnd}
                onChangeText={(t) => save({ ...prefs, quietHoursEnd: t })}
                onBlur={() => setTime("quietHoursEnd", prefs.quietHoursEnd)}
                placeholder="07:00"
                placeholderTextColor={theme.colors.textSecondary + "80"}
                style={[
                  styles.timeInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  back: { fontSize: 16, fontWeight: "600" },

  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 10 },

  statusCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 22,
    marginBottom: 24,
    alignItems: "center",
  },
  statusEmoji: { fontSize: 30, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  statusSubtitle: { fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  radiusRow: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radiusLabel: { fontSize: 16, fontWeight: "500" },
  radiusInput: {
    width: 90,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 15,
  },

  timeRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 10 },
  timeLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});