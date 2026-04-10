import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
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

type AccuracyMode = "balanced" | "high";

type LocationSettings = {
  locationEnabled: boolean;
  sharePreciseLocation: boolean;
  accuracyMode: AccuracyMode;
  emergencyRadiusKm: number;
  allowBackgroundUpdates: boolean;
  permissionStatus?: "granted" | "denied" | "undetermined";
  servicesEnabled?: boolean;
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
  servicesEnabled: undefined,
  lastKnownLocation: null,
};

  /**
 * Clamp
 */
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

  /**
   * Persist remote user location settings
   */
  const persistRemoteUserLocationSettings = async (next: LocationSettings) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          locationEnabled: next.locationEnabled,
          emergencyRadiusKm: next.emergencyRadiusKm,
          accuracyMode: next.accuracyMode,
          sharePreciseLocation: next.sharePreciseLocation,
          permissionStatus: next.permissionStatus ?? "undetermined",
          servicesEnabled: next.servicesEnabled ?? null,
          lastKnownLocation: next.lastKnownLocation ?? null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.log("Failed to sync location settings to Firestore", e);
    }
  };

  //  Always update from latest state (prevents stale state bugs)
  /**
   * Update settings
   */
  const updateSettings = async (patch: Partial<LocationSettings>) => {
    let nextValue: LocationSettings = DEFAULT_SETTINGS;

    setSettings((prev) => {
      nextValue = { ...prev, ...patch };
      return nextValue;
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
    } catch (e) {
      console.log("Failed to save location settings", e);
    }

    
    
    if (isAuthenticated) {
      await persistRemoteUserLocationSettings(nextValue);
    }

    return nextValue;
  };

  /**
   * Sync device location status
   */
  const syncDeviceLocationStatus = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const perm = await Location.getForegroundPermissionsAsync();

      const permissionStatus =
        perm.status === "granted"
          ? "granted"
          : perm.status === "denied"
          ? "denied"
          : "undetermined";

      //  Update only status fields; do NOT flip user setting or erase lastKnownLocation
      await updateSettings({
        servicesEnabled,
        permissionStatus,
      });
    } catch (e) {
      console.log("syncDeviceLocationStatus error", e);
    }
  };

  useEffect(() => {
    (async () => {
      let merged = DEFAULT_SETTINGS;

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        
        
        if (raw) {
          const parsed = JSON.parse(raw);
          merged = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            emergencyRadiusKm: clamp(
              Number(parsed.emergencyRadiusKm ?? 10),
              1,
              50
            ),
          };
        }

        setSettings(merged);
        setRadiusInput(String(merged.emergencyRadiusKm));
      } catch (e) {
        console.log("Failed to load location settings", e);
        setSettings(merged);
        setRadiusInput(String(merged.emergencyRadiusKm));
      } finally {
        await syncDeviceLocationStatus();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Request permission and fetch location
   */
  const requestPermissionAndFetchLocation = async (mode: AccuracyMode) => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();

    
    
    if (!servicesEnabled) {
      return {
        granted: false as const,
        status: "undetermined" as const,
        servicesEnabled,
        reason: "services_off" as const,
      };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();

    
    
    if (status !== "granted") {
      return {
        granted: false as const,
        status,
        servicesEnabled,
        reason: "permission_denied" as const,
      };
    }

    const accuracy =
      mode === "high" ? Location.Accuracy.Highest : Location.Accuracy.Balanced;

    const pos = await Location.getCurrentPositionAsync({ accuracy });

    return {
      granted: true as const,
      status,
      servicesEnabled,
      lastKnownLocation: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        updatedAt: new Date().toISOString(),
      },
    };
  };

  /**
   * Handle toggle location
   */
  const handleToggleLocation = async (value: boolean) => {
    
    
    if (!value) {
      await updateSettings({ locationEnabled: false });
      return;
    }

    
    
    if (!isAuthenticated) {
      Alert.alert(
        "Login required",
        "Please login to enable location services. Location sharing is linked to your verified donor profile.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Login", onPress: () => router.push("/profile") },
        ]
      );
      return;
    }

    // Optimistic ON
    await updateSettings({ locationEnabled: true });

    try {
      const result = await requestPermissionAndFetchLocation(settings.accuracyMode);

      
      
      if (!result.granted) {
        await updateSettings({
          locationEnabled: false,
          permissionStatus: result.status as any,
          servicesEnabled: (result as any).servicesEnabled,
        });

        if ((result as any).reason === "services_off") {
          Alert.alert(
            "Turn on device location",
            "Your phone’s Location Services (GPS) is OFF. Please turn it ON in device settings and try again."
          );
        } else {
          Alert.alert(
            "Permission required",
            "RaktaCare needs location permission to match you with nearby emergency blood requests.\n\nYou can enable it later from your device settings."
          );
        }
        return;
      }

      await updateSettings({
        locationEnabled: true,
        permissionStatus: "granted",
        servicesEnabled: result.servicesEnabled,
        lastKnownLocation: result.lastKnownLocation,
      });

      Alert.alert(
        "Location enabled",
        "Thanks! We can now match you with nearby emergency blood alerts."
      );
    } catch (e) {
      console.log("Location permission error:", e);
      Alert.alert("Location error", "Could not access location. Please try again.");
      await updateSettings({ locationEnabled: false });
    }
  };

  const statusConfig = useMemo(() => {
    const services = settings.servicesEnabled;

    
    
    if (!isAuthenticated) {
      return {
        color: theme.colors.danger,
        bg: theme.colors.dangerLight,
        title: "Login required",
        subtitle: "Login to enable location services.",
        emoji: "🔒",
      };
    }

    
    
    if (services === false) {
      return {
        color: theme.colors.danger,
        bg: theme.colors.dangerLight,
        title: "Device GPS is OFF",
        subtitle: "Turn on Location Services in device settings.",
        emoji: "📴",
      };
    }

    
    
    if (settings.permissionStatus === "denied") {
      return {
        color: theme.colors.danger,
        bg: theme.colors.dangerLight,
        title: "Permission denied",
        subtitle: "Enable Location in device settings.",
        emoji: "⛔",
      };
    }

    
    
    if (!settings.locationEnabled) {
      return {
        color: theme.colors.warning,
        bg: theme.colors.warningLight,
        title: "Location is OFF",
        subtitle: "Turn it on to receive emergency matching.",
        emoji: "📍",
      };
    }

    return {
      color: theme.colors.success,
      bg: theme.colors.successLight,
      title: "Location is ON",
      subtitle: "Matching enabled based on your proximity.",
      emoji: "✅",
    };
  }, [
    settings.locationEnabled,
    settings.permissionStatus,
    settings.servicesEnabled,
    isAuthenticated,
    theme,
  ]);

  /**
   * Apply radius
   */
  const applyRadius = async () => {
    const parsed = Number(radiusInput);
    if (!Number.isFinite(parsed)) {
      Alert.alert("Invalid radius", "Please enter a valid number (1 to 50).");
      setRadiusInput(String(settings.emergencyRadiusKm));
      return;
    }
    const nextRadius = clamp(Math.round(parsed), 1, 50);
    setRadiusInput(String(nextRadius));
    await updateSettings({ emergencyRadiusKm: nextRadius });
  };

  /**
   * Refresh now
   */
  const refreshNow = async () => {
    try {
      await syncDeviceLocationStatus();

      
      
      if (!settings.locationEnabled) {
        Alert.alert("Location is OFF", "Turn on location first.");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      
      
      if (!servicesEnabled) {
        await updateSettings({ locationEnabled: false, servicesEnabled: false });
        Alert.alert("GPS is OFF", "Please turn on GPS in device settings.");
        return;
      }

      const perm = await Location.getForegroundPermissionsAsync();
      
      
      if (perm.status !== "granted") {
        await updateSettings({
          locationEnabled: false,
          permissionStatus: perm.status as any,
        });
        Alert.alert("Permission required", "Enable location manually in settings.");
        return;
      }

      const result = await requestPermissionAndFetchLocation(settings.accuracyMode);
      
      
      if (!result.granted) {
        Alert.alert("Error", "Could not access location.");
        return;
      }

      await updateSettings({
        permissionStatus: "granted",
        servicesEnabled: result.servicesEnabled,
        lastKnownLocation: result.lastKnownLocation,
      });

      Alert.alert("Updated", "Your location has been refreshed.");
    } catch (e) {
      console.log("refresh error:", e);
      Alert.alert("Error", "Could not refresh location.");
    }
  };

  const gpsLabel =
    settings.servicesEnabled === undefined
      ? "UNKNOWN"
      : settings.servicesEnabled
      ? "ENABLED"
      : "DISABLED";

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Location Services
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Match with emergency donors based on your current vicinity.
        </Text>

        {!isAuthenticated && (
          <View
            style={[
              styles.loginBanner,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Text style={[styles.loginBannerTitle, { color: theme.colors.primary }]}>
              Login required
            </Text>
            <Text style={[styles.loginBannerText, { color: theme.colors.textSecondary }]}>
              Location matching is linked to your verified profile for trust and safety.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={[styles.loginBannerBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.loginBannerBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
          <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {statusConfig.title}
          </Text>
          <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
            {statusConfig.subtitle}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Permissions
          </Text>

          <View
            style={[
              styles.groupCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                  Track My Location
                </Text>
                <Text style={[styles.rowDesc, { color: theme.colors.textSecondary }]}>
                  Enable matching with local alerts
                </Text>
              </View>
              <Switch
                value={settings.locationEnabled}
                onValueChange={handleToggleLocation}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={settings.locationEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>

            <View style={styles.radiusRow}>
              <Text style={[styles.radiusLabel, { color: theme.colors.text }]}>
                Emergency Radius
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={radiusInput}
                  onChangeText={setRadiusInput}
                  keyboardType="numeric"
                  onBlur={applyRadius}
                  style={[
                    styles.radiusInput,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                />
                <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}>
                  km
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Service Details
          </Text>

          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                padding: 16,
              },
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Device GPS
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: gpsLabel === "ENABLED" ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {gpsLabel}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Permission
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      settings.permissionStatus === "granted"
                        ? theme.colors.success
                        : theme.colors.text,
                  },
                ]}
              >
                {settings.permissionStatus?.toUpperCase() ?? "UNKNOWN"}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Latitude
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {settings.lastKnownLocation?.lat?.toFixed(6) ?? "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Longitude
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {settings.lastKnownLocation?.lng?.toFixed(6) ?? "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Accuracy
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {settings.lastKnownLocation?.accuracy ?? "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Last Refresh
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {settings.lastKnownLocation?.updatedAt
                  ? new Date(settings.lastKnownLocation.updatedAt).toLocaleString()
                  : "Never"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={refreshNow}
              style={[
                styles.refreshBtn,
                {
                  backgroundColor: settings.locationEnabled
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                },
              ]}
              disabled={!settings.locationEnabled}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshBtnText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },

  loginBanner: { marginHorizontal: 20, borderRadius: 14, padding: 20, marginBottom: 20 },
  loginBannerTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  loginBannerText: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  loginBannerBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  loginBannerBtnText: { color: "#fff", fontWeight: "700" },

  statusCard: { marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 28, alignItems: "center" },
  statusEmoji: { fontSize: 36, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  statusSubtitle: { fontSize: 13, textAlign: "center", marginTop: 4, opacity: 0.8 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 10, opacity: 0.8 },

  groupCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowDesc: { fontSize: 12, marginTop: 2, opacity: 0.7 },

  radiusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  radiusLabel: { fontSize: 16, fontWeight: "600" },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  radiusInput: { width: 60, height: 38, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15 },
  unitText: { fontSize: 14, marginLeft: 8 },

  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  detailLabel: { fontSize: 14, fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, marginVertical: 12 },

  refreshBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  refreshBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default LocationServices;