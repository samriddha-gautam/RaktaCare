import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BloodRequest {
  id: string;
  bloodType: string;
  description: string;
  location: string;
  contactPhone: string;
  userId: string;
  userName: string;
  userEmail: string | null;

  //  include deleted to match Firestore data/hook
  status: "active" | "completed" | "deleted";

  createdAt: any;
}

interface CardsProps {
  filterBloodType?: string;
  displayRequests: BloodRequest[];
  activeRequests: BloodRequest[];
  isLoadingRequests: boolean;
  errorRequests: string | null;
  toggleRequestStatus: (
    id: string,
    status: "active" | "completed"
  ) => Promise<{ success: boolean; error?: string }>;
  enabled: boolean;
}

const Cards = ({
  filterBloodType = "",
  displayRequests,
  activeRequests,
  isLoadingRequests,
  errorRequests,
  toggleRequestStatus,
  enabled,
}: CardsProps) => {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const { user } = useAuth();

  //  filter out deleted everywhere
  const visibleDisplayRequests = useMemo(
    () => displayRequests.filter((r) => r.status !== "deleted"),
    [displayRequests]
  );

  const visibleActiveRequests = useMemo(
    () => activeRequests.filter((r) => r.status !== "deleted"),
    [activeRequests]
  );

  const filteredRequests = useMemo(() => {
    const base = visibleDisplayRequests;
    if (!filterBloodType) return base;
    return base.filter((request) => request.bloodType === filterBloodType);
  }, [visibleDisplayRequests, filterBloodType]);

  const filteredActiveCount = useMemo(() => {
    const base = visibleActiveRequests;
    if (!filterBloodType) return base.length;
    return base.filter((request) => request.bloodType === filterBloodType).length;
  }, [visibleActiveRequests, filterBloodType]);

  const handleToggleStatus = async (
    requestId: string,
    currentStatus: "active" | "completed"
  ) => {
    const action = currentStatus === "active" ? "complete" : "reactivate";

    Alert.alert(
      `${action === "complete" ? "Mark as Completed" : "Reactivate Request"}`,
      `Do you want to ${action} this request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const result = await toggleRequestStatus(requestId, currentStatus);
            
            
            if (result.success) {
              Alert.alert(
                "Success",
                `Request ${
                  action === "complete" ? "marked as completed" : "reactivated"
                } successfully!`
              );
            } else {
              Alert.alert("Error", result.error || "Failed to update status");
            }
          },
        },
      ]
    );
  };

  /**
   * Format date
   */
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInHours < 1) return `${diffInMins} mins ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  /**
   * Open details
   */
  const openDetails = (request: BloodRequest) => {
    router.push({
      pathname: "/request-details/[id]",
      params: { id: request.id },
    });
  };

  
  
  if (!enabled) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.emptyContainer}>
          <Text style={[gstyles.text, styles.emptyText]}>
            Please login to view blood requests.
          </Text>
        </View>
      </View>
    );
  }

  
  
  if (isLoadingRequests) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  
  
  if (errorRequests) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.errorContainer}>
          <Text style={[gstyles.text, styles.errorText]}>{errorRequests}</Text>
        </View>
      </View>
    );
  }

  
  
  if (filteredRequests.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.emptyContainer}>
          <Text style={[gstyles.text, styles.emptyText]}>
            {filterBloodType
              ? `No "${filterBloodType}" requests available right now`
              : "No blood requests available"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, gstyles.text]}>
          {filterBloodType ? `${filterBloodType} Requests` : "Recent Requests"}
        </Text>
        <Text style={[gstyles.textSecondary, styles.requestCount]}>
          {filteredActiveCount} active
        </Text>
      </View>

      {filteredRequests.map((request) => (
        <TouchableOpacity
          key={request.id}
          style={[
            gstyles.card,
            styles.recentCard,
            request.status === "completed" && styles.completedCard,
          ]}
          activeOpacity={0.8}
          onPress={() => openDetails(request)}
        >
          <View style={[styles.recentImage, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.bloodTypeInImage}>{request.bloodType}</Text>
          </View>

          <View style={styles.recentContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.recentTitle, { color: theme.colors.text }]}>
                {request.bloodType}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      request.status === "active"
                        ? theme.colors.success
                        : theme.colors.textMuted,
                  },
                ]}
              >
                <Text style={styles.statusText}>{request.status}</Text>
              </View>
            </View>

            <Text
              style={[styles.recentDescription, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {request.description}
            </Text>

            <Text style={[styles.recentLocation, { color: theme.colors.primary }]}>
              {request.location}
            </Text>

            <View style={styles.footerRow}>
              <Text style={[gstyles.textSecondary, styles.timeText]}>
                {formatDate(request.createdAt)}
              </Text>

              {user && user.uid === request.userId && request.status !== "deleted" && (
                <TouchableOpacity
                  style={[styles.toggleButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleToggleStatus(request.id, request.status as "active" | "completed")}
                >
                  <Text style={styles.toggleButtonText}>
                    {request.status === "active" ? "Mark Complete" : "Reactivate"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Cards;

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginHorizontal: 20 },
  requestCount: { fontSize: 14 },
  recentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    flexDirection: "row",
    padding: 14,
  },
  completedCard: { opacity: 0.5 },
  recentImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bloodTypeInImage: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  recentContent: { flex: 1, justifyContent: "space-between" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentTitle: { fontSize: 18, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  recentDescription: { fontSize: 14, marginTop: 4 },
  recentLocation: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  timeText: { fontSize: 12 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  loadingContainer: { padding: 40, alignItems: "center" },
  errorContainer: { padding: 20, marginHorizontal: 20, alignItems: "center" },
  errorText: { textAlign: "center" },
  emptyContainer: { padding: 40, marginHorizontal: 20, alignItems: "center" },
  emptyText: { fontSize: 16, textAlign: "center", marginBottom: 8 },
});