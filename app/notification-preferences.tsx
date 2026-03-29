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
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type NotificationPreferences = {
  notificationsEnabled: boolean;
  emergencyRequestsEnabled: boolean;
  donationRemindersEnabled: boolean;
  matchOnlyMyBloodGroup: boolean;
  maxDistanceKm: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
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
            ...next,
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

  const statusConfig = useMemo(() => {
    if (!isAuthenticated) {
      return {
        color: theme.colors.danger,
        bg: theme.colors.dangerLight,
        title: "Login required",
        subtitle: "Login to sync preferences and matching.",
        emoji: "🔒",
      };
    }
    if (!prefs.notificationsEnabled) {
      return {
        color: theme.colors.danger,
        bg: theme.colors.dangerLight,
        title: "Notifications OFF",
        subtitle: "Enable to receive emergency matched requests.",
        emoji: "🔕",
      };
    }
    if (!prefs.emergencyRequestsEnabled && !prefs.donationRemindersEnabled) {
      return {
        color: theme.colors.warning,
        bg: theme.colors.warningLight,
        title: "No alerts active",
        subtitle: "Turn on at least one alert type below.",
        emoji: "⚠️",
      };
    }
    return {
      color: theme.colors.success,
      bg: theme.colors.successLight,
      title: "Notifications ON",
      subtitle: "Preferences active for donor matching.",
      emoji: "✅",
    };
  }, [isAuthenticated, prefs, theme]);

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
      <KeyboardAwareScrollView 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.back, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Notification Prefs
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose how and when RaktaCare notifies you for requests.
        </Text>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
          <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>{statusConfig.title}</Text>
          <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>{statusConfig.subtitle}</Text>
        </View>

        {/* Categories Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Category Controls</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
               <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Master Toggle</Text>
                  <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>Main switch for all notifications</Text>
               </View>
               <Switch
                  value={prefs.notificationsEnabled}
                  onValueChange={(v) => save({ ...prefs, notificationsEnabled: v, emergencyRequestsEnabled: v ? prefs.emergencyRequestsEnabled : false, donationRemindersEnabled: v ? prefs.donationRemindersEnabled : false })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={prefs.notificationsEnabled ? "#fff" : "#f4f3f4"}
               />
            </View>
            <View style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
               <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Emergency Alerts</Text>
                  <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>Nearby urgent blood requests</Text>
               </View>
               <Switch
                  value={prefs.emergencyRequestsEnabled}
                  onValueChange={(v) => {
                    if (!prefs.notificationsEnabled && v) {
                       Alert.alert("Enable Master", "Turn on notifications master switch first.");
                       return;
                    }
                    save({ ...prefs, emergencyRequestsEnabled: v });
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={prefs.emergencyRequestsEnabled ? "#fff" : "#f4f3f4"}
                  disabled={!prefs.notificationsEnabled}
               />
            </View>
            <View style={styles.row}>
               <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Reminders</Text>
                  <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>Your donation schedule updates</Text>
               </View>
               <Switch
                  value={prefs.donationRemindersEnabled}
                  onValueChange={(v) => {
                    if (!prefs.notificationsEnabled && v) {
                       Alert.alert("Enable Master", "Turn on notifications master switch first.");
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
        </View>

        {/* Matching Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Matching Filters</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <View style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>My Blood Only</Text>
                    <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>Only show matching blood groups</Text>
                </View>
                <Switch
                    value={prefs.matchOnlyMyBloodGroup}
                    onValueChange={(v) => save({ ...prefs, matchOnlyMyBloodGroup: v })}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={prefs.matchOnlyMyBloodGroup ? "#fff" : "#f4f3f4"}
                />
             </View>
             <View style={styles.radiusRow}>
                <Text style={[styles.radiusLabel, { color: theme.colors.text }]}>Max Distance</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        value={distanceInput}
                        onChangeText={setDistanceInput}
                        keyboardType="numeric"
                        onBlur={applyDistance}
                        style={[styles.radiusInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                    />
                    <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}>km</Text>
                </View>
             </View>
          </View>
        </View>

        {/* Quiet Hours Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Quiet Hours</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <View style={[styles.row, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Enable Quiet Hours</Text>
                    <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>No alerts during sleep or work</Text>
                </View>
                <Switch
                    value={prefs.quietHoursEnabled}
                    onValueChange={(v) => save({ ...prefs, quietHoursEnabled: v })}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={prefs.quietHoursEnabled ? "#fff" : "#f4f3f4"}
                />
             </View>
             {prefs.quietHoursEnabled && (
                 <View style={styles.timeRow}>
                    <View style={styles.timeGroup}>
                        <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Start Time</Text>
                        <TextInput
                            value={prefs.quietHoursStart}
                            onChangeText={(t) => save({ ...prefs, quietHoursStart: t })}
                            placeholder="22:00"
                            style={[styles.timeInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        />
                    </View>
                    <View style={styles.timeGroup}>
                        <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>End Time</Text>
                        <TextInput
                            value={prefs.quietHoursEnd}
                            onChangeText={(t) => save({ ...prefs, quietHoursEnd: t })}
                            placeholder="07:00"
                            style={[styles.timeInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        />
                    </View>
                 </View>
             )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  back: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },

  statusCard: { marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 28, alignItems: "center" },
  statusEmoji: { fontSize: 36, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  statusSubtitle: { fontSize: 13, textAlign: "center", marginTop: 4, opacity: 0.8 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 10, opacity: 0.8 },
  groupCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowDesc: { fontSize: 12, marginTop: 2, opacity: 0.7 },

  radiusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  radiusLabel: { fontSize: 16, fontWeight: "600" },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  radiusInput: { width: 60, height: 38, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15 },
  unitText: { fontSize: 14, marginLeft: 8 },

  timeRow: { flexDirection: "row", padding: 16, gap: 16 },
  timeGroup: { flex: 1 },
  timeLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" },
  timeInput: { borderRadius: 8, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, textAlign: "center", fontSize: 15 },
});