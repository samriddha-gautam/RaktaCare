import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useBloodRequests, BloodRequest } from "@/hooks/useBloodRequests";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";

// minimal small card for one request
const MiniRequest = ({ r }: { r: BloodRequest }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.miniCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
      onPress={() => router.push({ pathname: "/request-details/[id]", params: { id: r.id } })}
    >
      <Text style={[styles.miniTitle, { color: theme.colors.text }]}>{r.bloodType} • {r.location}</Text>
      <Text style={[styles.miniSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
        {r.description}
      </Text>
    </TouchableOpacity>
  );
};

export default function RecentRequestsPreview() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated && !!user?.uid;
  const { displayRequests, activeRequests, completedRequests } = useBloodRequests(enabled);
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);

  const visible = useMemo(() => displayRequests.slice(0, 3), [displayRequests]);

  const urgentCount = useMemo(
    () => displayRequests.filter((r: any) => (r as any).urgent === true).length,
    [displayRequests]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, gstyles.text]}>Recent Requests</Text>
        <View style={styles.stats}>
          <Text style={[gstyles.textSecondary]}>{activeRequests.length} active</Text>
          <Text style={[gstyles.textSecondary, { marginLeft: 8 }]}>{completedRequests.length} done</Text>
          {urgentCount > 0 && <Text style={[gstyles.textSecondary, { marginLeft: 8 }]}>🔥 {urgentCount} urgent</Text>}
        </View>
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={gstyles.textSecondary}>No recent requests — create the first one</Text>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.push("/(tabs)/add")}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>Create Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((r) => (
            <MiniRequest key={r.id} r={r} />
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/requests")}>
          <Text style={[gstyles.text, { fontWeight: "800" }]}>View all</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/nearby")}>
          <Text style={[gstyles.textSecondary]}>Nearby hospitals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, paddingHorizontal: 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "900" },
  stats: { flexDirection: "row", alignItems: "center" },
  list: { flexDirection: "row", gap: 8 },
  miniCard: { borderWidth: 1, borderRadius: 12, padding: 10, flex: 1, marginRight: 8 },
  miniTitle: { fontWeight: "900" },
  miniSubtitle: { fontSize: 12, marginTop: 4 },
  empty: { padding: 12, alignItems: "flex-start" },
  createBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});