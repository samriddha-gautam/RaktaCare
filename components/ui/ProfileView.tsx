import { StyleSheet,Text,View,ActivityIndicator,TouchableOpacity,TextInput, Alert} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { User } from "firebase/auth";

interface ProfileData {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
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

  const dynamicStyles = StyleSheet.create({
    accentButton: { backgroundColor: accentColor },
    lightBackground: { backgroundColor: backgroundColor },
    accentText: { color: accentColor },
  });

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, dynamicStyles.lightBackground]}>
          <Text style={[styles.welcomeText, dynamicStyles.accentText]}>
            Hello {profileData?.name || profileData?.displayName || 'User'}!
          </Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.accentText]}>
              Your Profile
            </Text>
            <TouchableOpacity 
              onPress={() => setIsEditing(!isEditing)}
              style={[styles.editButton, dynamicStyles.accentButton]}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileDetails}>
            {/* Display Name */}
            <View style={styles.profileItem}>
              <Text style={styles.label}>Display Name:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editedData.name || editedData.displayName || ''}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, name: text, displayName: text }))}
                  placeholder={profileData?.displayName}
                />
              ) : (
                <Text style={styles.value}>
                  {profileData?.name || profileData?.displayName || 'Not provided'}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.profileItem}>
              <Text style={styles.label}>Email:</Text>
              <Text style={[styles.value, { color: '#6B7280' }]}>
                {profileData?.email || user?.email || 'Not provided'}
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.profileItem}>
              <Text style={styles.label}>Phone:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editedData.phone || ''}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>
                  {profileData?.phone || 'Not provided'}
                </Text>
              )}
            </View>

            {/* User ID */}
            <View style={styles.profileItem}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={[styles.value, { fontSize: 12, color: '#9CA3AF' }]}>
                {profileData?.id || user?.uid || 'Not available'}
              </Text>
            </View>
          </View>

          {/* Save Button (only show when editing) */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, dynamicStyles.accentButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: '#6B7280' }]}
            onPress={onRefresh}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, dynamicStyles.accentButton]}
            onPress={onLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {loading && (
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
    flex: 1,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  profileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  refreshButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});