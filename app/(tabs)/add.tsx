import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequest } from "@/hooks/useCreateBloodRequest";
import { useAuthStore } from "@/stores/authStore";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";



const Add = () => {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const router = useRouter();

  const { user, isAuthenticated, profileData, isLoading } = useAuthStore();
  const role = profileData?.role;

  const { createBloodRequest, isSubmitting, getDefaultPhone } = useBloodRequest();

  const [selectedBloodType, setSelectedBloodType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>(profileData?.phone || "");
  const [unitsNeeded, setUnitsNeeded] = useState<string>("1");

  // Guard: block donor/admin from opening this screen
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      Alert.alert("Please log in", "Log in to create a blood request.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
      return;
    }

    if (role === "donor" || role === "admin") {
      Alert.alert("Not allowed", "Only requesters can create blood requests.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
      return;
    }
  }, [isLoading, isAuthenticated, user, role, router]);

  // Set default phone on mount / when profile changes
  useEffect(() => {
    if (profileData?.phone && !contactPhone) {
      setContactPhone(profileData.phone);
    }
  }, [profileData?.phone]);

  const handleSubmit = async () => {
    if (!selectedBloodType || !description || !location || !contactPhone) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const result = await createBloodRequest({
      bloodType: selectedBloodType,
      description,
      location,
      contactPhone,
      unitsNeeded: parseInt(unitsNeeded, 10) || 1,
    });

    if (result.success) {
      Alert.alert("Success", "Your blood request has been created successfully!", [
        {
          text: "OK",
          onPress: () => {
            setSelectedBloodType("");
            setDescription("");
            setLocation("");
            setUnitsNeeded("1");
            setContactPhone(profileData?.phone || "");
            router.back();
          },
        },
      ]);
    } else {
      Alert.alert("Error", result.error || "Failed to create request");
    }
  };

  if (isLoading) {
     return (
       <View style={[gstyles.container, styles.center]}>
         <ActivityIndicator size="large" color={theme.colors.primary} />
       </View>
     );
  }



  return (
    <View style={[gstyles.container, styles.container]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <Text style={[gstyles.title, styles.title]}>Create Blood Request</Text>
        <Text style={[gstyles.textSecondary, styles.subtitle]}>
          Fill in the details to request blood donation
        </Text>

        {/* Blood Type Selection */}
        <View style={styles.section}>
          <Text style={[gstyles.text, styles.label]}>
            Blood Type <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <View style={styles.bloodTypeSection}>
          <HorizontalScroll
            selectedBloodType={selectedBloodType}
            onSelectBloodType={setSelectedBloodType}
            showTitle={false}
          />
        </View>

        {/* Units Needed Selection */}
        <View style={styles.section}>
          <Text style={[gstyles.text, styles.label]}>
            Units Required <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="e.g., 2"
            placeholderTextColor={theme.colors.textSecondary}
            value={unitsNeeded}
            onChangeText={setUnitsNeeded}
            keyboardType="numeric"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
             <Text style={[gstyles.text, styles.label]}>
              Description <Text style={styles.required}>*</Text>
            </Text>
          </View>
          


          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="e.g., Required A+ blood asap in MediCity Hospital"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[gstyles.text, styles.label]}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="e.g., MediCity Hospital, Kathmandu"
            placeholderTextColor={theme.colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Contact Phone */}
        <View style={styles.section}>
          <Text style={[gstyles.text, styles.label]}>
            Contact Phone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="e.g., 9812345678"
            placeholderTextColor={theme.colors.textSecondary}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: isSubmitting ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default Add;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { marginTop: 10, marginBottom: 8 },
  subtitle: { marginBottom: 30, fontSize: 16 },
  section: { marginBottom: 24 },
  bloodTypeSection: { marginBottom: 24, marginLeft: -20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  keywordsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  keywordChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  keywordText: { fontSize: 12, fontWeight: "700" },
  required: { color: "#DC2626" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});