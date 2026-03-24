import { uploadProfilePhotoAsync } from "@/services/firebase/profilePhoto";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { User } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  photoURL?: string;

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
  accentColor = "#DC2626",
  backgroundColor = "#FEF2F2",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(profileData || {});
  const [photoUploading, setPhotoUploading] = useState(false);


  const dynamicStyles = StyleSheet.create({
    accentButton: { backgroundColor: accentColor },
    lightBackground: { backgroundColor: backgroundColor },
    accentText: { color: accentColor },
  });

  const verification = useMemo(() => {
    const role = (profileData?.role || "donor").toString();
    const verified = Boolean(profileData?.verified);

    if (role !== "donor") {
      return {
        label: `Role: ${role}`,
        color: "#2563EB",
        bg: "#DBEAFE",
        note: "This account is not a donor account.",
      };
    }

    if (verified) {
      return {
        label: "Verified Donor",
        color: "#16A34A",
        bg: "#DCFCE7",
        note: "You can receive emergency alerts based on your settings.",
      };
    }

    return {
      label: "Not Verified",
      color: "#F59E0B",
      bg: "#FEF3C7",
      note: "Verification is required for emergency alerts and location sharing.",
    };
  }, [profileData?.role, profileData?.verified]);

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

  const handleCancel = () => {
    setEditedData(profileData || {});
    setIsEditing(false);
  };

  const pickAndUploadPhoto = async () => {
    try {
      setPhotoUploading(true);

      // Permission
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // user can crop
        aspect: [1, 1],      // square crop (passport style)
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      // Validate by file extension (fallback) + mime (if available)
      const fileName = asset.fileName?.toLowerCase() || asset.uri.toLowerCase();
      const isAllowed =
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png");

      if (!isAllowed) {
        Alert.alert("Invalid file", "Only JPG / JPEG / PNG files are allowed.");
        return;
      }

      // Resize to PP-size-ish (square 512x512)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { downloadURL } = await uploadProfilePhotoAsync({
        uri: manipulated.uri,
        mimeType: "image/jpeg", // we saved as jpeg above
      });

      // Update local profile state so Header updates immediately
      const next = { ...(profileData || {}), photoURL: downloadURL };
      await onUpdateProfile(next);

      Alert.alert("✅ Updated", "Profile photo updated successfully.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Upload failed", e?.message || "Could not upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  if (!profileData && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No profile data available</Text>
          <TouchableOpacity
            style={[styles.refreshButton, dynamicStyles.accentButton]}
            onPress={onRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = profileData?.photoURL || user?.photoURL || "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome */}
        <View style={[styles.welcomeSection, dynamicStyles.lightBackground]}>
          <Text style={[styles.welcomeText, dynamicStyles.accentText]}>
            Hello {profileData?.name || profileData?.displayName || "User"}!
          </Text>
        </View>

        {/* ✅ Profile photo + upload */}
        <View style={styles.photoRow}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {(profileData?.displayName?.[0] ||
                  profileData?.name?.[0] ||
                  "U"
                ).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.photoButton, dynamicStyles.accentButton]}
              onPress={pickAndUploadPhoto}
              disabled={photoUploading}
            >
              <Text style={styles.photoButtonText}>
                {photoUploading ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.photoHint}>
              JPG / PNG only. Crop to a clear face photo (PP size).
            </Text>
          </View>
        </View>

        {/* Verification badge */}
        <View style={[styles.verificationCard, { backgroundColor: verification.bg }]}>
          <Text style={[styles.verificationLabel, { color: verification.color }]}>
            {verification.label}
          </Text>
          <Text style={styles.verificationNote}>{verification.note}</Text>
        </View>

        {/* Profile info */}
        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.accentText]}>
              Your Profile
            </Text>

            <TouchableOpacity
              onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}
              style={[styles.editButton, dynamicStyles.accentButton]}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.profileItem}>
              <Text style={styles.label}>Display Name:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
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
                <Text style={styles.value}>
                  {profileData?.name ||
                    profileData?.displayName ||
                    "Not provided"}
                </Text>
              )}
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.label}>Email:</Text>
              <Text style={[styles.value, { color: "#6B7280" }]}>
                {profileData?.email || user?.email || "Not provided"}
              </Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.label}>Phone:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editedData.phone || ""}
                  onChangeText={(text) =>
                    setEditedData((prev: any) => ({ ...prev, phone: text }))
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>
                  {profileData?.phone || "Not provided"}
                </Text>
              )}
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={[styles.value, { fontSize: 12, color: "#9CA3AF" }]}>
                {profileData?.id || user?.uid || "Not available"}
              </Text>
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, dynamicStyles.accentButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: "#6B7280" }]}
            onPress={onRefresh}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? "Refreshing..." : "Refresh Data"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, dynamicStyles.accentButton]}
            onPress={onLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>
              {loading ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>

        {(loading || photoUploading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProfileView;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  welcomeSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  welcomeText: { fontSize: 24, fontWeight: "bold" },

  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E5E7EB",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#374151",
  },
  photoButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  photoButtonText: { color: "#fff", fontWeight: "800" },
  photoHint: { marginTop: 6, fontSize: 11, color: "#6B7280" },

  verificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  verificationLabel: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  verificationNote: { fontSize: 12, color: "#374151", lineHeight: 16 },

  profileSection: { flex: 1, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  editButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  profileDetails: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  profileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 4 },
  value: { fontSize: 16, color: "#1F2937" },
  editInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },

  saveButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  actionButtons: { gap: 12 },
  refreshButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  refreshButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  logoutButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  logoutButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },

  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noDataText: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 16 },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});