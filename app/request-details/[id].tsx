import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "bloodRequests", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Request not found");
          return;
        }

        setRequest({ id: snap.id, ...snap.data() });
      } catch (e: any) {
        setError(e.message || "Failed to load request");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.center}>
        <Text style={[gstyles.text, styles.errorText]}>
          {error || "No request found"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Request Details
        </Text>

        <Text style={[styles.bloodType, { color: theme.colors.primary }]}>
          {request.bloodType}
        </Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Request made by</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.userName || "Unknown"}</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.userEmail || "N/A"}</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Contact Phone</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.contactPhone || "N/A"}</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Location</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.location}</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.description}</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Status</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{request.status}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  bloodType: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
  },
});