import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
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
    View
} from "react-native";

type AccuracyMode = "balanced" | "high";

type LocationSettings = {
  locationEnabled: boolean;
  sharePreciseLocation: boolean;
  accuracyMode: AccuracyMode;
  emergencyRadiusKm: number;
  allowBackgroundUpdates: boolean;
  permissionStatus?: "granted" | "denied" | "undetermined";
  lastKnownLocation?: {
    lat: number;
    lng: number;
    accuracy?: number | null;
    updatedAt: string;
  } | null;
};

const STORAGE_KEY = "locationSettings";

const DEFAULT_SETTINGS: LocationSettings = {
  locationEnabled: false,
  sharePreciseLocation: false,
  accuracyMode: "balanced",
  emergencyRadiusKm: 10,
  allowBackgroundUpdates: false,
  permissionStatus: "undetermined",
  lastKnownLocation: null,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const LocationServices: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);
  const [radiusInput, setRadiusInput] = useState(
    String(DEFAULT_SETTINGS.emergencyRadiusKm)
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const merged: LocationSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            emergencyRadiusKm: clamp(
              Number(parsed.emergencyRadiusKm ?? 10),
              1,
              50
            ),
          };
          setSettings(merged);
          setRadiusInput(String(merged.emergencyRadiusKm));
        }
      } catch (e) {
        console.log("Failed to load location settings", e);
      }
    })();
  }, []);

  const save = async (next: LocationSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("Failed to save location settings", e);
    }
  };

  const requestPermissionAndFetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "RaktaCare needs location access to match you with nearby emergency blood requests.\n\nYou can enable it later from your device settings."
      );
      return { granted: false as const, status };
    }

    const accuracy =
      settings.accuracyMode === "high"
        ? Location.Accuracy.Highest
        : Location.Accuracy.Balanced;

    const pos = await Location.getCurrentPositionAsync({ accuracy });

    const lastKnownLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
      updatedAt: new Date().toISOString(),
    };

    return { granted: true as const, status, lastKnownLocation };
  };

  const handleToggleLocation = async (value: boolean) => {
    // ✅ SECURITY: must be logged in to enable
    if (value && !isAuthenticated) {
      Alert.alert(
        "Login required",
        "Please login to enable location services. Location sharing is linked to your verified donor profile.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Login", onPress: () => router.push("/profile") }
        ]
      );
      // Keep toggle OFF
      await save({ ...settings, locationEnabled: false });
      return;
    }

    if (!value) {
      await save({
        ...settings,
        locationEnabled: false,
      });
      return;
    }

    try {
      const result = await requestPermissionAndFetchLocation();

      if (!result.granted) {
        await save({
          ...settings,
          locationEnabled: false,
          permissionStatus: result.status,
        });
        return;
      }

      await save({
        ...settings,
        locationEnabled: true,
        permissionStatus: "granted",
        lastKnownLocation: result.lastKnownLocation,
      });

      Alert.alert(
        "Location enabled",
        "Thanks! We can now match you with nearby emergency blood alerts."
      );
    } catch (e) {
      console.log("Location permission error:", e);
      Alert.alert("Location error", "Could not access location. Please try again.");
      await save({
        ...settings,
        locationEnabled: false,
      });
    }
  };

  const StatusCard = useMemo(() => {
    if (!settings.locationEnabled) {
      return {
        color: "#EF4444",
        title: "Location is OFF",
        subtitle: isAuthenticated
          ? "Turn it on to receive emergency blood alerts based on distance."
          : "Login to enable location services.",
        emoji: "📍",
      };
    }
    return {
      color: "#22C55E",
      title: "Location is ON",
      subtitle: settings.sharePreciseLocation
        ? "Precise location enabled (best matching)."
        : "Approximate location enabled (more privacy).",
      emoji: "✅",
    };
  }, [settings.locationEnabled, settings.sharePreciseLocation, isAuthenticated]);

  const applyRadius = async () => {
    const parsed = Number(radiusInput);
    if (!Number.isFinite(parsed)) {
      Alert.alert("Invalid radius", "Please enter a valid number (1 to 50).");
      setRadiusInput(String(settings.emergencyRadiusKm));
      return;
    }
    const nextRadius = clamp(Math.round(parsed), 1, 50);
    setRadiusInput(String(nextRadius));
    await save({ ...settings, emergencyRadiusKm: nextRadius });
  };

  const refreshNow = async () => {
    try {
      if (!settings.locationEnabled) {
        Alert.alert("Location is OFF", "Turn on location first.");
        return;
      }
      const accuracy =
        settings.accuracyMode === "high"
          ? Location.Accuracy.Highest
          : Location.Accuracy.Balanced;

      const pos = await Location.getCurrentPositionAsync({ accuracy });

      await save({
        ...settings,
        lastKnownLocation: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          updatedAt: new Date().toISOString(),
        },
      });

      Alert.alert("Updated", "Location refreshed.");
    } catch (e) {
      console.log("refresh location error", e);
      Alert.alert("Error", "Could not refresh location.");
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Location Services
        </Text>

        {!isAuthenticated && (
          <View
            style={[
              styles.loginBanner,
              { backgroundColor: theme.colors.primary + "15" },
            ]}
          >
            <Text style={[styles.loginBannerTitle, { color: theme.colors.primary }]}>
              Login required
            </Text>
            <Text style={[styles.loginBannerText, { color: theme.colors.textSecondary }]}>
              Location sharing is linked to a verified donor profile to prevent abuse and protect privacy.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={[styles.loginBannerBtn, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
            >
              <Text style={styles.loginBannerBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Configure how RaktaCare uses your location for emergency donor matching.
        </Text>

        <View
          style={[styles.statusCard, { backgroundColor: StatusCard.color + "15" }]}
        >
          <Text style={styles.statusEmoji}>{StatusCard.emoji}</Text>
          <Text style={[styles.statusTitle, { color: StatusCard.color }]}>
            {StatusCard.title}
          </Text>
          <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
            {StatusCard.subtitle}
          </Text>
        </View>

        {/* Toggle row (simple, aligned with your settings UI) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Permissions
          </Text>

          <View
            style={[
              styles.row,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                Enable Location
              </Text>
              <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                Turning on will request device location permission.
              </Text>
            </View>
            <Switch
              value={settings.locationEnabled}
              onValueChange={handleToggleLocation}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={settings.locationEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Radius */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Emergency Alert Radius
          </Text>

          <View
            style={[
              styles.radiusRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.radiusLabel, { color: theme.colors.text }]}>
              Radius (km)
            </Text>
            <TextInput
              value={radiusInput}
              onChangeText={setRadiusInput}
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
              onBlur={applyRadius}
              returnKeyType="done"
              onSubmitEditing={applyRadius}
            />
          </View>
        </View>

        {/* Current Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Current Location
          </Text>

          <View
            style={[
              styles.locationCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.locationLine, { color: theme.colors.text }]}>
              Permission:{" "}
              <Text style={{ color: theme.colors.textSecondary }}>
                {settings.permissionStatus ?? "undetermined"}
              </Text>
            </Text>

            <Text style={[styles.locationLine, { color: theme.colors.text }]}>
              Latitude:{" "}
              <Text style={{ color: theme.colors.textSecondary }}>
                {settings.lastKnownLocation?.lat ?? "—"}
              </Text>
            </Text>
            <Text style={[styles.locationLine, { color: theme.colors.text }]}>
              Longitude:{" "}
              <Text style={{ color: theme.colors.textSecondary }}>
                {settings.lastKnownLocation?.lng ?? "—"}
              </Text>
            </Text>

            <TouchableOpacity
              onPress={refreshNow}
              style={[
                styles.refreshBtn,
                {
                  backgroundColor: settings.locationEnabled
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              activeOpacity={0.9}
              disabled={!settings.locationEnabled}
            >
              <Text style={styles.refreshBtnText}>
                Refresh Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { fontSize: 16, fontWeight: "600" },
  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },

  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 10 },

  loginBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  loginBannerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  loginBannerText: { fontSize: 12, lineHeight: 16 },
  loginBannerBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  loginBannerBtnText: { color: "#fff", fontWeight: "700" },

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
    width: 80,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 15,
  },

  locationCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  locationLine: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  refreshBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  refreshBtnText: { color: "#fff", fontWeight: "700" },
});

export default LocationServices;