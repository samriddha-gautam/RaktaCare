import Button from "@/components/common/Button";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import {
  approveVerificationRequest,
  listPendingVerificationRequests,
  rejectVerificationRequest,
} from "@/services/firebase/verification/adminVerificationRepo";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { VerificationRequest } from "@/services/firebase/verification/verificationRepo";

export default function AdminVerifications() {
  const router = useRouter();
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);
  const { user, profileData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [rejectReasonByUid, setRejectReasonByUid] = useState<Record<string, string>>(
    {}
  );

  const isAdmin = profileData?.role === "admin";

  /**
   * Load
   */
  const load = async () => {
    setLoading(true);
    try {
      const pending = await listPendingVerificationRequests();
      setItems(pending);
    } catch (e: any) {
      console.log("admin verifications load error:", e);
      Alert.alert("Error", e?.message ?? "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /**
   * Approve
   */
  const approve = async (uid: string) => {
    if (!user?.uid) return;
    try {
      await approveVerificationRequest(uid, user.uid);
      Alert.alert("Approved", "Donor has been verified.");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to approve.");
    }
  };

  /**
   * Reject
   */
  const reject = async (uid: string) => {
    if (!user?.uid) return;
    const reason = (rejectReasonByUid[uid] || "").trim();
    
    
    if (!reason) {
      Alert.alert("Reason required", "Please enter a rejection reason.");
      return;
    }
    try {
      await rejectVerificationRequest(uid, user.uid, reason);
      Alert.alert("Rejected", "Request rejected.");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to reject.");
    }
  };

  
  
  if (!isAdmin) {
    return (
      <SafeAreaView style={g.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: theme.colors.text }]}>
            Admin Verifications
          </Text>
        </View>

        <View style={styles.center}>
          <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>
            Not authorized. This page is only for admins.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={g.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          Verification Requests
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>
            Loading pending requests...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Button title="Refresh" onPress={load} fullWidth />

          {items.length === 0 ? (
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
              No pending requests.
            </Text>
          ) : null}

          {items.map((r) => (
            <View
              key={r.uid}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {r.uid}
              </Text>

              <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                Phone: {r.phone}
              </Text>
              <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                Blood Group: {r.bloodGroup}
              </Text>
              <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                Age: {r.age}
              </Text>
              <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                Last Donation: {r.lastDonationDate}
              </Text>
              <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                City: {r.city}
              </Text>
              {r.notes ? (
                <Text style={[styles.small, { color: theme.colors.textSecondary }]}>
                  Notes: {r.notes}
                </Text>
              ) : null}

              <View style={{ height: 10 }} />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button title="Approve" onPress={() => approve(r.uid)} fullWidth />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Button
                    title="Reject"
                    onPress={() => reject(r.uid)}
                    fullWidth
                  />
                </View>
              </View>

              <Text style={[styles.rejectLabel, { color: theme.colors.textSecondary }]}>
                Rejection reason (required to reject)
              </Text>
              <TextInput
                value={rejectReasonByUid[r.uid] || ""}
                onChangeText={(t) =>
                  setRejectReasonByUid((prev) => ({ ...prev, [r.uid]: t }))
                }
                placeholder="e.g. Invalid phone / insufficient details"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              />
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  back: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  title: { fontSize: 13, fontWeight: "900", marginBottom: 6 },
  small: { fontSize: 12, lineHeight: 16 },

  row: { flexDirection: "row", alignItems: "center" },

  rejectLabel: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});