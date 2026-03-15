import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Nepal Red Cross Society eligibility criteria
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const MEDICAL_CONDITIONS = [
  { id: "hiv", label: "HIV / AIDS" },
  { id: "hepatitisB", label: "Hepatitis B" },
  { id: "hepatitisC", label: "Hepatitis C" },
  { id: "heartDisease", label: "Heart Disease" },
  { id: "cancer", label: "Cancer" },
  { id: "hemophilia", label: "Hemophilia" },
  { id: "thalassemia", label: "Thalassemia" },
  { id: "diabetes", label: "Diabetes (on insulin)" },
  { id: "epilepsy", label: "Epilepsy / Seizures" },
];

const TEMPORARY_CONDITIONS = [
  { id: "pregnant", label: "Currently Pregnant", waitDays: 365 },
  { id: "breastfeeding", label: "Currently Breastfeeding", waitDays: 180 },
  {
    id: "recentSurgery",
    label: "Recent Surgery (within 6 months)",
    waitDays: 180,
  },
  {
    id: "tattoo",
    label: "Recent Tattoo / Piercing (within 1 year)",
    waitDays: 365,
  },
  { id: "medication", label: "Currently on Medication", waitDays: 0 },
  { id: "recentIllness", label: "Recent Illness / Fever", waitDays: 14 },
  {
    id: "recentVaccine",
    label: "Recent Vaccination (within 4 weeks)",
    waitDays: 28,
  },
];

interface EligibilityData {
  bloodType: string;
  age: string;
  weight: string;
  hemoglobin: string;
  systolicBP: string;
  diastolicBP: string;
  permanentConditions: Record<string, boolean>;
  temporaryConditions: Record<string, boolean>;
  availableForEmergency: boolean;
  willingToTravel: boolean;
  maxTravelDistance: string;
}

const DEFAULT_DATA: EligibilityData = {
  bloodType: "",
  age: "",
  weight: "",
  hemoglobin: "",
  systolicBP: "",
  diastolicBP: "",
  permanentConditions: {},
  temporaryConditions: {},
  availableForEmergency: true,
  willingToTravel: true,
  maxTravelDistance: "10",
};

const EligibilitySettings: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();

  const { isAuthenticated } = useAuth();

  const [data, setData] = useState<EligibilityData>(DEFAULT_DATA);
  const [eligibilityStatus, setEligibilityStatus] = useState<
    "eligible" | "temporary" | "ineligible" | "incomplete"
  >("incomplete");

  useEffect(() => {
    if (isAuthenticated) loadSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    checkEligibility();
  }, [data]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("eligibilitySettings");
      if (saved) {
        setData({ ...DEFAULT_DATA, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.log("Error loading eligibility settings:", error);
    }
  };

  const saveSettings = async () => {
    if (!isAuthenticated) {
      Alert.alert("Please log in", "Log in to save your eligibility info.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => router.push("/profile") },
      ]);
      return;
    }

    try {
      await AsyncStorage.setItem("eligibilitySettings", JSON.stringify(data));
      Alert.alert("✅ Saved", "Your eligibility info has been updated.");
    } catch (error) {
      console.log("Error saving eligibility settings:", error);
    }
  };

  const updateField = (field: keyof EligibilityData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePermanentCondition = (id: string) => {
    setData((prev) => ({
      ...prev,
      permanentConditions: {
        ...prev.permanentConditions,
        [id]: !prev.permanentConditions[id],
      },
    }));
  };

  const toggleTemporaryCondition = (id: string) => {
    setData((prev) => ({
      ...prev,
      temporaryConditions: {
        ...prev.temporaryConditions,
        [id]: !prev.temporaryConditions[id],
      },
    }));
  };

  const checkEligibility = () => {
    const age = parseInt(data.age);
    const weight = parseFloat(data.weight);
    const hb = parseFloat(data.hemoglobin);
    const systolic = parseInt(data.systolicBP);
    const diastolic = parseInt(data.diastolicBP);

    if (!data.bloodType || !data.age || !data.weight) {
      setEligibilityStatus("incomplete");
      return;
    }

    const hasPermanent = Object.values(data.permanentConditions).some(
      (v) => v === true
    );
    if (hasPermanent) {
      setEligibilityStatus("ineligible");
      return;
    }

    if (age < 18 || age > 60) {
      setEligibilityStatus("ineligible");
      return;
    }
    if (weight < 45) {
      setEligibilityStatus("ineligible");
      return;
    }
    if (hb && hb < 12) {
      setEligibilityStatus("ineligible");
      return;
    }
    if (systolic && (systolic < 110 || systolic > 160)) {
      setEligibilityStatus("ineligible");
      return;
    }
    if (diastolic && (diastolic < 70 || diastolic > 96)) {
      setEligibilityStatus("ineligible");
      return;
    }

    const hasTemporary = Object.values(data.temporaryConditions).some(
      (v) => v === true
    );
    if (hasTemporary) {
      setEligibilityStatus("temporary");
      return;
    }

    setEligibilityStatus("eligible");
  };

  const getStatusConfig = () => {
    switch (eligibilityStatus) {
      case "eligible":
        return {
          emoji: "✅",
          title: "You Are Eligible to Donate!",
          subtitle: "You meet all Nepal Red Cross donation criteria",
          color: "#22C55E",
        };
      case "temporary":
        return {
          emoji: "⏳",
          title: "Temporarily Ineligible",
          subtitle:
            "You have a temporary condition. Please wait until it clears.",
          color: "#F59E0B",
        };
      case "ineligible":
        return {
          emoji: "❌",
          title: "Currently Not Eligible",
          subtitle:
            "Based on your info, you may not be eligible. Consult your doctor.",
          color: "#EF4444",
        };
      default:
        return {
          emoji: "📋",
          title: "Complete Your Info",
          subtitle: "Fill in your details to check eligibility",
          color: theme.colors.textSecondary,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const InputRow = ({
    label,
    value,
    onChangeText,
    placeholder,
    unit,
    keyboardType = "numeric",
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    unit?: string;
    keyboardType?: "numeric" | "default";
  }) => (
    <View
      style={[
        styles.inputRow,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={styles.inputRight}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
        />
        {unit && (
          <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );

  // ✅ Clean login-required UI (no "settings/donor profile" wording)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.lockedContainer}>
          <Text style={[styles.lockedTitle, { color: theme.colors.text }]}>
            Please log in
          </Text>

          <Text style={[styles.lockedText, { color: theme.colors.textSecondary }]}>
            Log in to check and save your blood donation eligibility.
          </Text>

          <TouchableOpacity
            style={[styles.lockedButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push("/profile")}
            activeOpacity={0.9}
          >
            <Text style={styles.lockedButtonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
            <Text style={[styles.backLink, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Eligibility
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Based on Nepal Red Cross Society criteria
        </Text>

        {/* Eligibility Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: statusConfig.color + "15" },
          ]}
        >
          <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {statusConfig.title}
          </Text>
          <Text
            style={[
              styles.statusSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {statusConfig.subtitle}
          </Text>
        </View>

        {/* Blood Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Blood Type
          </Text>
          <View style={styles.bloodTypeGrid}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeChip,
                  {
                    backgroundColor:
                      data.bloodType === type
                        ? theme.colors.primary
                        : theme.colors.surface,
                    borderColor:
                      data.bloodType === type
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => updateField("bloodType", type)}
              >
                <Text
                  style={[
                    styles.bloodTypeText,
                    {
                      color: data.bloodType === type ? "#fff" : theme.colors.text,
                      fontWeight: data.bloodType === type ? "700" : "500",
                    },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Basic Health Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Basic Health Information
          </Text>

          <InputRow
            label="Age"
            value={data.age}
            onChangeText={(v) => updateField("age", v)}
            placeholder="18-60"
            unit="years"
          />
          <InputRow
            label="Weight"
            value={data.weight}
            onChangeText={(v) => updateField("weight", v)}
            placeholder="Min 45"
            unit="kg"
          />
          <InputRow
            label="Hemoglobin"
            value={data.hemoglobin}
            onChangeText={(v) => updateField("hemoglobin", v)}
            placeholder="Min 12"
            unit="gm/dl"
          />

          <View style={[styles.criteriaBox, { backgroundColor: theme.colors.primary + "10" }]}>
            <Text style={[styles.criteriaTitle, { color: theme.colors.primary }]}>
              🇳🇵 Nepal Red Cross Criteria
            </Text>
            <Text style={[styles.criteriaText, { color: theme.colors.textSecondary }]}>
              • Age: 18 - 60 years{"\n"}• Weight: Above 45 kg{"\n"}• Hemoglobin: Above 12 gm/dl{"\n"}• BP: 110-160 / 70-96 mmHg
            </Text>
          </View>
        </View>

        {/* Blood Pressure */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Blood Pressure (Optional)
          </Text>
          <InputRow
            label="Systolic"
            value={data.systolicBP}
            onChangeText={(v) => updateField("systolicBP", v)}
            placeholder="110-160"
            unit="mmHg"
          />
          <InputRow
            label="Diastolic"
            value={data.diastolicBP}
            onChangeText={(v) => updateField("diastolicBP", v)}
            placeholder="70-96"
            unit="mmHg"
          />
        </View>

        {/* Permanent Medical Conditions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Permanent Medical Conditions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select if you have any of the following (these permanently affect eligibility)
          </Text>

          {MEDICAL_CONDITIONS.map((condition) => (
            <View
              key={condition.id}
              style={[
                styles.conditionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                  ...(data.permanentConditions[condition.id] && {
                    borderLeftWidth: 3,
                    borderLeftColor: "#EF4444",
                  }),
                },
              ]}
            >
              <Text style={[styles.conditionLabel, { color: theme.colors.text }]}>
                {condition.label}
              </Text>
              <Switch
                value={data.permanentConditions[condition.id] || false}
                onValueChange={() => togglePermanentCondition(condition.id)}
                trackColor={{
                  false: theme.colors.border,
                  true: "#EF4444",
                }}
                thumbColor={data.permanentConditions[condition.id] ? "#fff" : "#f4f3f4"}
              />
            </View>
          ))}
        </View>

        {/* Temporary Conditions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Temporary Conditions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Select if any currently apply (these temporarily affect eligibility)
          </Text>

          {TEMPORARY_CONDITIONS.map((condition) => (
            <View
              key={condition.id}
              style={[
                styles.conditionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                  ...(data.temporaryConditions[condition.id] && {
                    borderLeftWidth: 3,
                    borderLeftColor: "#F59E0B",
                  }),
                },
              ]}
            >
              <View style={styles.conditionTextContainer}>
                <Text style={[styles.conditionLabel, { color: theme.colors.text }]}>
                  {condition.label}
                </Text>
                {condition.waitDays > 0 && (
                  <Text style={[styles.waitText, { color: theme.colors.textSecondary }]}>
                    Wait period: {condition.waitDays} days
                  </Text>
                )}
              </View>
              <Switch
                value={data.temporaryConditions[condition.id] || false}
                onValueChange={() => toggleTemporaryCondition(condition.id)}
                trackColor={{
                  false: theme.colors.border,
                  true: "#F59E0B",
                }}
                thumbColor={data.temporaryConditions[condition.id] ? "#fff" : "#f4f3f4"}
              />
            </View>
          ))}
        </View>

        {/* Emergency Availability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Emergency Availability
          </Text>

          <View
            style={[
              styles.conditionItem,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.conditionTextContainer}>
              <Text style={[styles.conditionLabel, { color: theme.colors.text }]}>
                Available for Emergency Alerts
              </Text>
              <Text style={[styles.waitText, { color: theme.colors.textSecondary }]}>
                Receive urgent blood request notifications
              </Text>
            </View>
            <Switch
              value={data.availableForEmergency}
              onValueChange={(v) => updateField("availableForEmergency", v)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={data.availableForEmergency ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View
            style={[
              styles.conditionItem,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.conditionTextContainer}>
              <Text style={[styles.conditionLabel, { color: theme.colors.text }]}>
                Willing to Travel
              </Text>
              <Text style={[styles.waitText, { color: theme.colors.textSecondary }]}>
                Travel to donation centers for emergencies
              </Text>
            </View>
            <Switch
              value={data.willingToTravel}
              onValueChange={(v) => updateField("willingToTravel", v)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={data.willingToTravel ? "#fff" : "#f4f3f4"}
            />
          </View>

          {data.willingToTravel && (
            <InputRow
              label="Max Distance"
              value={data.maxTravelDistance}
              onChangeText={(v) => updateField("maxTravelDistance", v)}
              placeholder="10"
              unit="km"
            />
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor:
                eligibilityStatus === "ineligible"
                  ? theme.colors.textSecondary
                  : theme.colors.primary,
            },
          ]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
          ⚠️ This eligibility check is for guidance only. Final eligibility is determined by medical staff.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { fontSize: 16, fontWeight: "600" },

  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },

  statusCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  statusEmoji: { fontSize: 36, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  statusSubtitle: { fontSize: 13, textAlign: "center", marginTop: 4, lineHeight: 18 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionSubtitle: { fontSize: 12, marginHorizontal: 20, marginBottom: 10 },

  bloodTypeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  bloodTypeChip: { width: 70, height: 44, borderRadius: 12, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  bloodTypeText: { fontSize: 16 },

  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  inputLabel: { fontSize: 16, fontWeight: "500", flex: 1 },
  inputRight: { flexDirection: "row", alignItems: "center" },
  textInput: { width: 80, height: 38, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15 },
  unitText: { fontSize: 13, marginLeft: 8, width: 45 },

  criteriaBox: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 16 },
  criteriaTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  criteriaText: { fontSize: 13, lineHeight: 20 },

  conditionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  conditionTextContainer: { flex: 1, marginRight: 12 },
  conditionLabel: { fontSize: 16, fontWeight: "500" },
  waitText: { fontSize: 12, marginTop: 2 },

  saveButton: { marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  disclaimer: { fontSize: 11, textAlign: "center", marginHorizontal: 24, marginTop: 16, lineHeight: 16 },

  // login-required UI
  lockedContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 60, alignItems: "center" },
  lockedTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  lockedText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  lockedButton: { marginTop: 18, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12 },
  lockedButtonText: { color: "#fff", fontWeight: "800" },
  backLink: { fontSize: 16, fontWeight: "700" },
});

export default EligibilitySettings;