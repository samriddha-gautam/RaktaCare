import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { User } from "firebase/auth";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


interface ProfileData {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;

  role?: "donor" | "hospital" | "bloodbank" | "requester" | "admin" | string;
  verified?: boolean;
  verifiedAt?: string | null;
  verificationMethod?: string | null;

  [key: string]: any;
}

interface ProfileViewProps {
  user: User | null;
  profileData: ProfileData | null;
  onUpdateProfile: (data: ProfileData) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
  loading?: boolean;
  accentColor?: string;
  backgroundColor?: string;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profileData,
  onUpdateProfile,
  onRefresh,
  onLogout,
  loading = false,
  accentColor: propAccentColor,
  backgroundColor: propBgColor,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(profileData || {});
  const accentColor = propAccentColor || theme.colors.primary;
  const backgroundColor = propBgColor || theme.colors.primaryLight;
  
  // Memoize styles to avoid recreation on every render
  const s = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    
    
    if (profileData && !isEditing) {
      setEditedData(profileData);
    }
  }, [profileData, isEditing]);


  // We can still use these for prop-based overrides if needed
  const dynamicStyles = useMemo(() => StyleSheet.create({
    accentButton: { backgroundColor: accentColor },
    lightBackground: { backgroundColor: backgroundColor },
    accentText: { color: accentColor },
  }), [accentColor, backgroundColor]);

  const isVerified = Boolean(profileData?.verified);
  const isDonor = (profileData?.role || "donor").toString() === "donor";

  /**
   * Handle save
   */
  const handleSave = async () => {
    try {
      await onUpdateProfile(editedData);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Profile update error:", error);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setEditedData(profileData || {});
    setIsEditing(false);
  };



  
  
  if (!profileData && !loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.noDataContainer}>
          <Text style={s.noDataText}>No profile data available</Text>
          <TouchableOpacity
            style={[s.refreshButton, dynamicStyles.accentButton]}
            onPress={onRefresh}
          >
            <Text style={s.refreshButtonText}>Refresh Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={[s.welcomeSection, dynamicStyles.lightBackground]}>
          <View style={s.welcomeRow}>
            <Text style={[s.welcomeText, dynamicStyles.accentText]}>
              Hello {profileData?.name || profileData?.displayName || "User"}!
            </Text>
            {isDonor && isVerified && (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#1D9BF0" />
              </View>
            )}
          </View>
          {isDonor && !isVerified && (
            <TouchableOpacity
              style={s.notVerifiedRow}
              onPress={() => router.push("/eligibility-settings")}
              activeOpacity={0.7}
            >
              <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
              <Text style={s.notVerifiedText}>Not verified</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
          {!isDonor && (
            <View style={s.roleBadgeRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#2563EB" />
              <Text style={[s.roleBadgeText, { color: "#2563EB" }]}>
                {(profileData?.role || "").toString()}
              </Text>
            </View>
          )}
        </View>

        <View style={s.photoRow}>
          <View style={[s.avatar, s.avatarFallback, { backgroundColor: backgroundColor }]}>
            <Text style={[s.avatarFallbackText, { color: accentColor }]}>
              {(profileData?.displayName?.[0] ||
                profileData?.name?.[0] ||
                "U"
              ).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Profile info */}
        <View style={s.profileSection}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, dynamicStyles.accentText]}>
              Your Profile
            </Text>

            <TouchableOpacity
              onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}
              style={[s.editButton, dynamicStyles.accentButton]}
              activeOpacity={0.8}
            >
              <Text style={s.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.profileDetails}>
            <View style={s.profileItem}>
              <Text style={s.label}>Display Name</Text>
              {isEditing ? (
                <TextInput
                  style={s.editInput}
                  value={editedData.name || editedData.displayName || ""}
                  onChangeText={(text) =>
                    setEditedData((prev: any) => ({
                      ...prev,
                      name: text,
                      displayName: text,
                    }))
                  }
                  placeholder={profileData?.displayName}
                />
              ) : (
                <Text style={s.value}>
                  {profileData?.name ||
                    profileData?.displayName ||
                    "Not provided"}
                </Text>
              )}
            </View>

            <View style={s.profileItem}>
              <Text style={s.label}>Email</Text>
              <Text style={[s.value, s.valueMuted]}>
                {profileData?.email || user?.email || "Not provided"}
              </Text>
            </View>

            <View style={s.profileItem}>
              <Text style={s.label}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={s.editInput}
                  value={editedData.phone || ""}
                  onChangeText={(text) =>
                    setEditedData((prev: any) => ({ ...prev, phone: text }))
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={s.value}>
                  {profileData?.phone || "Not provided"}
                </Text>
              )}
            </View>

            <View style={[s.profileItem, { borderBottomWidth: 0 }]}>
              <Text style={s.label}>User ID</Text>
              <Text style={[s.value, s.valueId]}>
                {profileData?.id || user?.uid || "Not available"}
              </Text>
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[s.saveButton, dynamicStyles.accentButton]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.saveButtonText}>
                {loading ? "Saving…" : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={s.actionButtons}>
          <TouchableOpacity
            style={[s.refreshButton, s.refreshButtonSecondary]}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={s.refreshButtonText}>
              {loading ? "Refreshing…" : "Refresh Data"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.logoutButton, dynamicStyles.accentButton]}
            onPress={onLogout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={s.logoutButtonText}>
              {loading ? "Logging out…" : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProfileView;

  /**
 * Create styles
 */
const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },

  welcomeSection: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  welcomeText: { fontSize: 24, fontWeight: "bold" },
  verifiedBadge: {
    marginLeft: 2,
    marginTop: 2,
  },
  notVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
  },
  notVerifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
  },
  roleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.surface,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 28,
    fontWeight: "800",
  },

  profileSection: { flex: 1, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  profileDetails: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  profileItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, color: theme.colors.text },
  valueMuted: { color: theme.colors.textMuted },
  valueId: { fontSize: 12, color: theme.colors.textMuted, fontFamily: undefined },
  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },

  saveButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  actionButtons: { gap: 12 },
  refreshButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  refreshButtonSecondary: { backgroundColor: theme.colors.textSecondary },
  refreshButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  logoutButton: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  logoutButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },

  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noDataText: { fontSize: 18, fontWeight: "600", color: theme.colors.text, marginBottom: 16 },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
});
