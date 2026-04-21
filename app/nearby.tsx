import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { fetchNearbyHospitals, NearbyPlace } from "@/services/firebase/osm/overpass";

export default function Nearby() {
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);

  const [loading, setLoading] = useState(true);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<NearbyPlace[]>([]);

  const region = useMemo(() => {
    if (!myLoc) return null;
    return {
      latitude: myLoc.lat,
      longitude: myLoc.lng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [myLoc]);

  /**
   * Open in google maps
   */
  const openInGoogleMaps = (lat: number, lng: number, label?: string) => {
    const q = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open Google Maps.")
    );
  };

  /**
   * Load
   */
  const load = async () => {
    try {
      setLoading(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      
      
      if (!servicesEnabled) {
        Alert.alert("GPS is OFF", "Please turn on device location services.");
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      
      
      if (perm.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Allow location permission to show nearby hospitals."
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMyLoc(center);

      const results = await fetchNearbyHospitals({
        center,
        radiusMeters: 8000,
        limit: 30,
      });

      setHospitals(results);
    } catch (e: any) {
      console.log("nearby load error:", e);
      Alert.alert("Error", e?.message ?? "Failed to load nearby hospitals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={g.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          Nearby Hospitals
        </Text>
      </View>

      {loading || !region ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Finding hospitals near you...
          </Text>
        </View>
      ) : (
        <>
          <MapView style={styles.map} initialRegion={region}>
            <Marker
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              title="You"
              pinColor={theme.colors.primary}
            />

            {hospitals.map((h) => (
              <Marker
                key={h.id}
                coordinate={{ latitude: h.lat, longitude: h.lng }}
                title={h.name}
                description={`${h.distanceKm.toFixed(2)} km away`}
                pinColor="#2563EB"
                onCalloutPress={() => openInGoogleMaps(h.lat, h.lng, h.name)}
              />
            ))}
          </MapView>

          <ScrollView contentContainerStyle={styles.list}>
            <TouchableOpacity
              style={[
                styles.refreshBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              activeOpacity={0.9}
              onPress={load}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>

            {hospitals.map((h) => (
              <TouchableOpacity
                key={h.id}
                activeOpacity={0.9}
                onPress={() => openInGoogleMaps(h.lat, h.lng, h.name)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.name, { color: theme.colors.text }]}>
                  🏥 {h.name}
                </Text>
                <Text style={[styles.addr, { color: theme.colors.textSecondary }]}>
                  {h.distanceKm.toFixed(2)} km away
                </Text>
              </TouchableOpacity>
            ))}

            {hospitals.length === 0 && (
              <Text style={{ color: theme.colors.textSecondary }}>
                No hospitals found within radius.
              </Text>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  back: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  loadingText: { marginTop: 10, fontSize: 13 },

  map: { width: "100%", height: 280 },
  list: { padding: 16, gap: 10 },

  refreshBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  refreshText: { color: "#fff", fontWeight: "900" },

  card: { borderWidth: 1, borderRadius: 14, padding: 12 },
  name: { fontSize: 15, fontWeight: "800" },
  addr: { marginTop: 6, fontSize: 12, lineHeight: 16 },
});