import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useMemo } from "react";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBloodRequests } from "@/hooks/useBloodRequests";

interface CardsProps {
  filterBloodType?: string;
}

const Cards = ({ filterBloodType = "" }: CardsProps) => {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const { user } = useAuth();
  const {
    displayRequests,
    activeRequests,
    isLoading,
    error,
    toggleRequestStatus,
  } = useBloodRequests();

  const filteredRequests = useMemo(() => {
    if (!filterBloodType) {
      return displayRequests;
    }
    return displayRequests.filter(
      (request) => request.bloodType === filterBloodType
    );
  }, [displayRequests, filterBloodType]);

  const filteredActiveCount = useMemo(() => {
    if (!filterBloodType) {
      return activeRequests.length;
    }
    return activeRequests.filter(
      (request) => request.bloodType === filterBloodType
    ).length;
  }, [activeRequests, filterBloodType]);

  const handleToggleStatus = async (
    requestId: string,
    currentStatus: "active" | "completed",
    userName: string
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
                `Request ${action === "complete" ? "marked as completed" : "reactivated"} successfully!`
              );
            } else {
              Alert.alert("Error", result.error || "Failed to update status");
            }
          },
        },
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, gstyles.text]}>Recent Requests</Text>
        <View style={styles.errorContainer}>
          <Text style={[gstyles.text, styles.errorText]}>{error}</Text>
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
              : "No blood requests available"
            }
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
        >
          <View style={styles.recentImage}>
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
                      request.status === "active" ? "#4CAF50" : "#9E9E9E",
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
            <Text style={styles.recentLocation}>{request.location}</Text>
            <View style={styles.footerRow}>
              <Text style={[gstyles.textSecondary, styles.timeText]}>
                {formatDate(request.createdAt)}
              </Text>
              {user && user.uid === request.userId && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() =>
                    handleToggleStatus(
                      request.id,
                      request.status,
                      request.userName
                    )
                  }
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
  section: {
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  requestCount: {
    fontSize: 14,
  },
  recentCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    flexDirection: "row",
    padding: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.6,
  },
  recentImage: {
    width: 80,
    height: 80,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  bloodTypeInImage: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  recentContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  recentDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  recentLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
    marginTop: 5,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
  },
  toggleButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    marginHorizontal: 20,
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    marginHorizontal: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});