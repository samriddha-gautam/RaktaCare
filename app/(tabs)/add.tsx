import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequest } from "@/hooks/useCreateBloodRequest";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Add = () => {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const router = useRouter();
  const { createBloodRequest, isSubmitting, getDefaultPhone } =
    useBloodRequest();

  const [selectedBloodType, setSelectedBloodType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  // Set default phone on mount
  useEffect(() => {
    setContactPhone(getDefaultPhone());
  }, []);

  const handleSubmit = async () => {
    const result = await createBloodRequest({
      bloodType: selectedBloodType,
      description,
      location,
      contactPhone,
    });

    if (result.success) {
      Alert.alert(
        "Success",
        "Your blood request has been created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setSelectedBloodType("");
              setDescription("");
              setLocation("");
              setContactPhone(getDefaultPhone());
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", result.error || "Failed to create request");
    }
  };

  return (
    <View style={[gstyles.container, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Description */}
        <View style={styles.section}>
          <Text style={[gstyles.text, styles.label]}>
            Description <Text style={styles.required}>*</Text>
          </Text>
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
      </ScrollView>
    </View>
  );
};

export default Add;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  bloodTypeSection: {
    marginBottom: 24,
    marginLeft: -20, // Offset the container padding for full-width scroll
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  required: {
    color: "#FF6B6B",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
