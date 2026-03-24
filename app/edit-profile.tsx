import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { createGlobalStyles, Theme } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ✅ FIX: InputField is now OUTSIDE the main component — prevents re-render on every keystroke
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  editable = true,
  multiline = false,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  editable?: boolean;
  multiline?: boolean;
  theme: Theme;
}) => (
  <View
    style={[
      styles.fieldRow,
      {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border,
      },
    ]}
  >
    <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
    <TextInput
      style={[
        styles.fieldInput,
        {
          color: editable ? theme.colors.text : theme.colors.textSecondary,
          borderColor: theme.colors.border,
          backgroundColor: editable
            ? theme.colors.background
            : theme.colors.surface,
        },
        multiline && styles.multilineInput,
        !editable && styles.disabledInput,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary + "80"}
      keyboardType={keyboardType}
      editable={editable}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  </View>
);

const EditProfile: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();
  const { user, profileData, setProfileData } = useAuth();
  const { updateUserProfile, loading } = useAuthActions();

  // Form state — pre-filled from profileData
  const [displayName, setDisplayName] = useState(
    profileData?.displayName || profileData?.name || ""
  );
  const [phone, setPhone] = useState(profileData?.phone || "");
  const [bloodType, setBloodType] = useState(profileData?.bloodType || "");
  const [address, setAddress] = useState(profileData?.address || "");
  const [city, setCity] = useState(profileData?.city || "");
  const [emergencyContact, setEmergencyContact] = useState(
    profileData?.emergencyContact || ""
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    profileData?.emergencyPhone || ""
  );

  const hasChanges = useCallback(() => {
    return (
      displayName !== (profileData?.displayName || profileData?.name || "") ||
      phone !== (profileData?.phone || "") ||
      bloodType !== (profileData?.bloodType || "") ||
      address !== (profileData?.address || "") ||
      city !== (profileData?.city || "") ||
      emergencyContact !== (profileData?.emergencyContact || "") ||
      emergencyPhone !== (profileData?.emergencyPhone || "")
    );
  }, [
    displayName,
    phone,
    bloodType,
    address,
    city,
    emergencyContact,
    emergencyPhone,
    profileData,
  ]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    if (phone && !/^(\+977)?[9][0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid Nepali phone number (e.g., 98XXXXXXXX)."
      );
      return;
    }

    try {
      const result = await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
      });

      if (result.success) {
        const updatedProfile = {
          ...profileData,
          id: profileData?.id || user?.uid,
          email: profileData?.email || user?.email || "",
          name: displayName.trim(),
          displayName: displayName.trim(),
          phone: phone.trim(),
          bloodType,
          address: address.trim(),
          city: city.trim(),
          emergencyContact: emergencyContact.trim(),
          emergencyPhone: emergencyPhone.trim(),
          updatedAt: new Date().toISOString(),
        };

        await setProfileData(updatedProfile);

        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to update profile.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Profile update error:", error);
    }
  };

  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          {hasChanges() && (
            <View
              style={[
                styles.unsavedBadge,
                { backgroundColor: theme.colors.primary + "20" },
              ]}
            >
              <Text
                style={[styles.unsavedText, { color: theme.colors.primary }]}
              >
                Unsaved changes
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Edit Profile
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Update your personal and donation information
        </Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + "20" },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {displayName
                ? displayName.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <Text
            style={[styles.avatarEmail, { color: theme.colors.textSecondary }]}
          >
            {user?.email || profileData?.email || ""}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Personal Information
          </Text>

          <InputField
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your full name"
            theme={theme}
          />

          <InputField
            label="Email"
            value={user?.email || profileData?.email || ""}
            onChangeText={() => {}}
            placeholder="Email"
            keyboardType="email-address"
            editable={false}
            theme={theme}
          />

          <InputField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            theme={theme}
          />

          <InputField
            label="City / District"
            value={city}
            onChangeText={setCity}
            placeholder="e.g., Kathmandu"
            theme={theme}
          />

          <InputField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Your full address"
            multiline={true}
            theme={theme}
          />
        </View>

        {/* Blood Type */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Blood Information
          </Text>
          <View style={styles.bloodTypeGrid}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeChip,
                  {
                    backgroundColor:
                      bloodType === type
                        ? theme.colors.primary
                        : theme.colors.surface,
                    borderColor:
                      bloodType === type
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => setBloodType(type)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: bloodType === type ? "#fff" : theme.colors.text,
                    fontWeight: bloodType === type ? "700" : "500",
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Emergency Contact
          </Text>

          <InputField
            label="Contact Name"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Name of emergency contact"
            theme={theme}
          />

          <InputField
            label="Contact Phone"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            theme={theme}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges()
                ? theme.colors.primary
                : theme.colors.textSecondary,
            },
          ]}
          onPress={handleSave}
          disabled={loading || !hasChanges()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Account Info Card */}
        <View
          style={[
            styles.accountCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              styles.accountCardTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Account Details
          </Text>

          <View style={styles.accountRow}>
            <Text
              style={[
                styles.accountLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              User ID
            </Text>
            <Text style={[styles.accountValue, { color: theme.colors.text }]}>
              {(profileData?.id || user?.uid || "N/A").slice(0, 16)}...
            </Text>
          </View>

          <View
            style={[
              styles.accountDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={styles.accountRow}>
            <Text
              style={[
                styles.accountLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Member Since
            </Text>
            <Text style={[styles.accountValue, { color: theme.colors.text }]}>
              {profileData?.createdAt
                ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>

          <View
            style={[
              styles.accountDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={styles.accountRow}>
            <Text
              style={[
                styles.accountLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Last Updated
            </Text>
            <Text style={[styles.accountValue, { color: theme.colors.text }]}>
              {profileData?.updatedAt
                ? new Date(profileData.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Never"}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: { fontSize: 16, fontWeight: "600" },
  unsavedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unsavedText: { fontSize: 12, fontWeight: "600" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
  },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 32, fontWeight: "700" },
  avatarEmail: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  fieldRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  fieldInput: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  disabledInput: {
    opacity: 0.6,
  },
  bloodTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  bloodTypeChip: {
    width: 70,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accountCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
  },
  accountCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  accountLabel: { fontSize: 13 },
  accountValue: { fontSize: 13, fontWeight: "500" },
  accountDivider: { height: 1 },
});

export default EditProfile;