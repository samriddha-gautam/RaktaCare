import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/services/firebase/config";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type MyRequest = {
  id: string;
  bloodType: string;
  description: string;
  location: string;
  contactPhone: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  status: "active" | "completed" | "deleted";
  createdAt: any;
};

export default function MyRequests() {
  const router = useRouter();
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated && !!user?.uid;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  useEffect(() => {
    
    
    if (!enabled || !user?.uid) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "bloodRequests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as MyRequest[];

        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error("MyRequests load error:", err);
        setError("Failed to load your requests.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [enabled, user?.uid, refreshKey]);

  const visibleItems = useMemo(
    () => items.filter((x) => x.status !== "deleted"),
    [items]
  );

  const active = useMemo(
    () => visibleItems.filter((x) => x.status === "active"),
    [visibleItems]
  );

  const completed = useMemo(
    () => visibleItems.filter((x) => x.status === "completed"),
    [visibleItems]
  );

  /**
   * Format date
   */
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInHours < 1) return `${diffInMins} mins ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  /**
   * Toggle status
   */
  const toggleStatus = async (id: string, current: "active" | "completed") => {
    try {
      const ref = doc(db, "bloodRequests", id);
      const next = current === "active" ? "completed" : "active";
      await updateDoc(ref, { status: next, updatedAt: Timestamp.now() });
      return { success: true as const };
    } catch (e: any) {
      return { success: false as const, error: e?.message ?? "Failed to update status" };
    }
  };

  /**
   * Soft delete
   */
  const softDelete = async (id: string) => {
    try {
      const ref = doc(db, "bloodRequests", id);
      await updateDoc(ref, {
        status: "deleted",
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true as const };
    } catch (e: any) {
      return { success: false as const, error: e?.message ?? "Failed to delete request" };
    }
  };

  /**
   * Confirm toggle
   */
  const confirmToggle = (req: MyRequest) => {
    if (req.status === "deleted") return;

    const action = req.status === "active" ? "complete" : "reactivate";
    Alert.alert(
      action === "complete" ? "Mark as Completed" : "Reactivate Request",
      `Do you want to ${action} this request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const r = await toggleStatus(req.id, req.status as "active" | "completed");
            if (!r.success) Alert.alert("Error", r.error);
          },
        },
      ]
    );
  };

  /**
   * Confirm delete
   */
  const confirmDelete = (req: MyRequest) => {
    Alert.alert(
      "Delete Request",
      "This will hide the request from the app. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const r = await softDelete(req.id);
            if (!r.success) Alert.alert("Error", r.error);
          },
        },
      ]
    );
  };

  
  
  if (!enabled) {
    return (
      <SafeAreaView style={g.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: theme.colors.text }]}>My Requests</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>
            Please log in to view your requests.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={g.container}>
      <Header ref={headerRef} headerHeight={DEFAULT_HEADER_HEIGHT} />

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: DEFAULT_HEADER_HEIGHT, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: "900" }}>
            My Requests
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
            Active: {active.length} • Completed: {completed.length}
          </Text>

          {loading ? (
            <View style={styles.centerPad}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : error ? (
            <Text style={{ color: theme.colors.danger, marginTop: 12 }}>{error}</Text>
          ) : visibleItems.length === 0 ? (
            <View style={styles.centerPad}>
              <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>
                You haven’t created any requests yet.
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/(tabs)/add")}
              >
                <Text style={styles.primaryBtnText}>Create a Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 12 }}>
              {visibleItems.map((r) => (
                <View
                  key={r.id}
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    r.status === "completed" && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={{ color: theme.colors.text, fontWeight: "900" }}>
                      {r.bloodType} • {r.status}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {formatDate(r.createdAt)}
                    </Text>
                  </View>

                  <Text style={{ color: theme.colors.text, marginTop: 6 }} numberOfLines={2}>
                    {r.description}
                  </Text>
                  <Text style={{ color: theme.colors.primary, marginTop: 6 }}>
                    {r.location}
                  </Text>

                  <View style={[styles.rowBetween, { marginTop: 10 }]}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { borderColor: theme.colors.border }]}
                      onPress={() =>
                        router.push({ pathname: "/request-details/[id]", params: { id: r.id } })
                      }
                    >
                      <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Details</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {r.status !== "deleted" && (
                        <TouchableOpacity
                          style={[styles.smallBtn, { borderColor: theme.colors.border }]}
                          onPress={() => confirmToggle(r)}
                        >
                          <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
                            {r.status === "active" ? "Complete" : "Reactivate"}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.smallBtn, { borderColor: theme.colors.danger }]}
                        onPress={() => confirmDelete(r)}
                      >
                        <Text style={{ color: theme.colors.danger, fontWeight: "900" }}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  back: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  centerPad: { paddingVertical: 40, alignItems: "center", gap: 12 },

  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },

  primaryBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
});