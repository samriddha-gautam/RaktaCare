import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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

// --- Module-level sub-components (stable references prevent keyboard dismissal) ---

const InputRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  keyboardType = "numeric",
  isLast = false,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  unit?: string;
  keyboardType?: "numeric" | "default";
  isLast?: boolean;
  theme: any;
}) => (
  <View
    style={[
      styles.inputRow,
      {
        borderBottomColor: theme.colors.border,
        borderBottomWidth: isLast ? 0 : 1,
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
        placeholderTextColor={theme.colors.textMuted}
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

const SwitchItem = ({
  label,
  subLabel,
  value,
  onValueChange,
  trackColor,
  isLast = false,
  theme,
}: {
  label: string;
  subLabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  trackColor: string;
  isLast?: boolean;
  theme: any;
}) => (
  <View
    style={[
      styles.conditionItem,
      {
        borderBottomColor: theme.colors.border,
        borderBottomWidth: isLast ? 0 : 1,
      },
    ]}
  >
    <View style={styles.conditionTextContainer}>
      <Text style={[styles.conditionLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      {subLabel && (
        <Text style={[styles.waitText, { color: theme.colors.textSecondary }]}>
           {subLabel}
        </Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: theme.colors.border,
        true: trackColor,
      }}
      thumbColor={value ? "#fff" : "#f4f3f4"}
    />
  </View>
);

const EligibilitySettings: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();

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

  /**
   * Load settings
   */
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

  /**
   * Save settings
   */
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

  const updateField = useCallback((field: keyof EligibilityData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Toggle permanent condition
   */
  const togglePermanentCondition = (id: string) => {
    setData((prev) => ({
      ...prev,
      permanentConditions: {
        ...prev.permanentConditions,
        [id]: !prev.permanentConditions[id],
      },
    }));
  };

  /**
   * Toggle temporary condition
   */
  const toggleTemporaryCondition = (id: string) => {
    setData((prev) => ({
      ...prev,
      temporaryConditions: {
        ...prev.temporaryConditions,
        [id]: !prev.temporaryConditions[id],
      },
    }));
  };

  /**
   * Check eligibility
   */
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

  /**
   * Get status config
   */
  const getStatusConfig = () => {
    
    
    switch (eligibilityStatus) {
      case "eligible":
        return {
          emoji: "✅",
          title: "You Are Eligible!",
          subtitle: "You meet Nepal Red Cross Society criteria",
          color: theme.colors.success,
          bg: theme.colors.successLight,
        };
      case "temporary":
        return {
          emoji: "⏳",
          title: "Temporarily Ineligible",
          subtitle: "Wait until your temporary condition clears",
          color: theme.colors.warning,
          bg: theme.colors.warningLight,
        };
      case "ineligible":
        return {
          emoji: "❌",
          title: "Currently Not Eligible",
          subtitle: "Based on info, you may not be eligible now",
          color: theme.colors.danger,
          bg: theme.colors.dangerLight,
        };
      default:
        return {
          emoji: "📋",
          title: "Check Eligibility",
          subtitle: "Fill in your details to check status",
          color: theme.colors.primary,
          bg: theme.colors.primaryLight,
        };
    }
  };

  const statusConfig = getStatusConfig();

  
  
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.lockedContainer}>
          <Text style={[styles.lockedTitle, { color: theme.colors.primary }]}>📋 Check Eligibility</Text>
          <Text style={[styles.lockedText, { color: theme.colors.textSecondary }]}>
            Create an account or log in to check your blood donation eligibility based on NRCS criteria.
          </Text>
          <TouchableOpacity
            style={[styles.lockedButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.lockedButtonText}>Continue to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.colors.text }]}>
          Eligibility Check
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Based on Nepal Red Cross Society criteria
        </Text>

        {/* Eligibility Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: statusConfig.bg },
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
                       ...(data.bloodType === type ? (theme.shadow.sm as any) : {}),
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

        {/* Health Info Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Basic Health Info
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <InputRow
                label="Age"
                value={data.age}
                onChangeText={(v) => updateField("age", v)}
                placeholder="18-60"
                unit="years"
                theme={theme}
            />
            <InputRow
                label="Weight"
                value={data.weight}
                onChangeText={(v) => updateField("weight", v)}
                placeholder="Min 45"
                unit="kg"
                theme={theme}
            />
            <InputRow
                label="Hemoglobin"
                value={data.hemoglobin}
                onChangeText={(v) => updateField("hemoglobin", v)}
                placeholder="Min 12"
                unit="gm/dl"
                isLast={true}
                theme={theme}
            />
          </View>

          <View style={[styles.criteriaBox, { backgroundColor: theme.colors.primary + "10" }]}>
            <Text style={[styles.criteriaTitle, { color: theme.colors.primary }]}>
              🇳🇵 NRCS Basic Criteria
            </Text>
            <Text style={[styles.criteriaText, { color: theme.colors.textSecondary }]}>
                • Age: 18 - 60 years · Weight: Above 45 kg{"\n"}
                • Hb: Above 12 gm/dl · BP: 110-160/70-96
            </Text>
          </View>
        </View>

        {/* Blood Pressure Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
             Blood Pressure (mmHg)
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <InputRow
                label="Systolic"
                value={data.systolicBP}
                onChangeText={(v) => updateField("systolicBP", v)}
                placeholder="110-160"
                theme={theme}
            />
            <InputRow
                label="Diastolic"
                value={data.diastolicBP}
                onChangeText={(v) => updateField("diastolicBP", v)}
                placeholder="70-96"
                isLast={true}
                theme={theme}
            />
          </View>
        </View>

        {/* Permanent Conditions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Permanent Conditions
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             {MEDICAL_CONDITIONS.map((c, i) => (
                <SwitchItem
                    key={c.id}
                    label={c.label}
                    value={data.permanentConditions[c.id] || false}
                    onValueChange={() => togglePermanentCondition(c.id)}
                    trackColor={theme.colors.danger}
                    isLast={i === MEDICAL_CONDITIONS.length - 1}
                    theme={theme}
                />
             ))}
          </View>
        </View>

        {/* Temporary Conditions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Temporary Conditions
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             {TEMPORARY_CONDITIONS.map((c, i) => (
                <SwitchItem
                    key={c.id}
                    label={c.label}
                    subLabel={c.waitDays > 0 ? `Wait period: ${c.waitDays} days` : undefined}
                    value={data.temporaryConditions[c.id] || false}
                    onValueChange={() => toggleTemporaryCondition(c.id)}
                    trackColor={theme.colors.warning}
                    isLast={i === TEMPORARY_CONDITIONS.length - 1}
                    theme={theme}
                />
             ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Alerts & Travel
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <SwitchItem
                label="Emergency Alerts"
                subLabel="Receive urgent local requests"
                value={data.availableForEmergency}
                onValueChange={(v) => updateField("availableForEmergency", v)}
                trackColor={theme.colors.primary}
                theme={theme}
             />
             <SwitchItem
                label="Willing to Travel"
                subLabel="Willing to travel to centers"
                value={data.willingToTravel}
                onValueChange={(v) => updateField("willingToTravel", v)}
                trackColor={theme.colors.primary}
                isLast={!data.willingToTravel}
                theme={theme}
             />
             {data.willingToTravel && (
                <InputRow
                    label="Max Distance"
                    value={data.maxTravelDistance}
                    onChangeText={(v) => updateField("maxTravelDistance", v)}
                    placeholder="10"
                    unit="km"
                    isLast={true}
                    theme={theme}
                />
             )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary, ...(theme.shadow.md as any) }]}
          onPress={saveSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Eligibility Info</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
             ⚠️ This is for guidance only. Final eligibility is determined by NRCS medical staff at donation.
        </Text>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, width: "100%" },
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  backText: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 28, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },

  statusCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    alignItems: "center",
  },
  statusEmoji: { fontSize: 36, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  statusSubtitle: { fontSize: 13, textAlign: "center", marginTop: 4, opacity: 0.8 },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 10,
    opacity: 0.8,
  },
  groupCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  bloodTypeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  bloodTypeChip: { width: 72, height: 44, borderRadius: 12, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  bloodTypeText: { fontSize: 16 },

  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputLabel: { fontSize: 15, fontWeight: "600", flex: 1 },
  inputRight: { flexDirection: "row", alignItems: "center" },
  textInput: { width: 76, height: 38, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15 },
  unitText: { fontSize: 13, marginLeft: 8, width: 45 },

  conditionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  conditionTextContainer: { flex: 1, marginRight: 12 },
  conditionLabel: { fontSize: 15, fontWeight: "600" },
  waitText: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  criteriaBox: { marginHorizontal: 20, marginTop: 14, borderRadius: 14, padding: 16 },
  criteriaTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  criteriaText: { fontSize: 13, lineHeight: 18 },

  saveButton: { marginHorizontal: 20, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer: { fontSize: 11, textAlign: "center", marginHorizontal: 32, marginTop: 20, lineHeight: 16 },

  lockedContainer: { flex: 1, paddingHorizontal: 32, paddingTop: 80, alignItems: "center" },
  lockedTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
  lockedText: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  lockedButton: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
  lockedButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

export default EligibilitySettings;