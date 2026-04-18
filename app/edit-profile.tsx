import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { createGlobalStyles, Theme } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
  theme: Theme;
  editable?: boolean;
  multiline?: boolean;
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
            : theme.colors.surfaceAlt,
        },
        multiline && styles.multilineInput,
        !editable && styles.disabledInput,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
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
  const { user, profileData, setProfileData } = useAuthStore();
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

  const hasChanges = useMemo(() => {
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



  /**
   * Handle save
   */
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    if (phone && !/^(\+?977)?[9][0-9]{9}$/.test(phone.replace(/\s+/g, ""))) {
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

  /**
   * Handle back
   */
  const handleBack = () => {
    
    
    if (hasChanges) {
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
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          {hasChanges && (
            <View
              style={[
                styles.unsavedBadge,
                { backgroundColor: theme.colors.primaryLight },
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

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Edit Profile
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Update your personal and donation information
        </Text>



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
                activeOpacity={0.75}
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
                    ...(bloodType === type ? (theme.shadow.sm as any) : {}),
                  },
                ]}
                onPress={() => setBloodType(type)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: bloodType === type ? theme.colors.white : theme.colors.text,
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
              backgroundColor: hasChanges
                ? theme.colors.primary
                : theme.colors.textMuted,
                opacity: (loading || !hasChanges) ? 0.7 : 1,
                ...(hasChanges ? (theme.shadow.md as any) : {}),
            },
          ]}
          onPress={handleSave}
          disabled={loading || !hasChanges}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
               Save Changes
            </Text>
          )}
        </TouchableOpacity>

        {/* Account Info Details */}
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
            <Text style={[styles.accountValue, { color: theme.colors.textMuted }]}>
              {profileData?.id || user?.uid || "N/A"}
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
      </KeyboardAwareScrollView>
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
    marginBottom: 8,
  },
  backText: { fontSize: 16, fontWeight: "700" },
  unsavedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  unsavedText: { fontSize: 12, fontWeight: "700" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 20,
  },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 34, fontWeight: "700" },
  avatarEmail: { fontSize: 14, fontWeight: "500" },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  fieldRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  disabledInput: {
    opacity: 0.7,
  },
  bloodTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  bloodTypeChip: {
    width: 76,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { fontSize: 17, fontWeight: "700" },
  accountCard: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 16,
    padding: 20,
  },
  accountCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  accountLabel: { fontSize: 14, fontWeight: "500" },
  accountValue: { fontSize: 13, fontWeight: "600" },
  accountDivider: { height: 1 },
});

export default EditProfile;