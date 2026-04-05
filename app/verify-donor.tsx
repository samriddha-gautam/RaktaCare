import Button from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
    getMyVerificationRequest,
    submitVerificationRequest,
    type VerificationRequest,
} from "@/services/firebase/verification/verificationRepo";
import { createGlobalStyles } from "@/styles/globalStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function VerifyDonor() {
  const router = useRouter();
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);
  const { user, profileData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [existingReq, setExistingReq] = useState<VerificationRequest | null>(
    null
  );

  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [age, setAge] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState<Date>(new Date());
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);

  const statusLabel = useMemo(() => {
    if (profileData?.verified) return "Verified (Approved)";
    if (existingReq?.status === "pending") return "Pending Review";
    if (existingReq?.status === "rejected") return "Rejected";
    return "Not Submitted";
  }, [existingReq?.status, profileData?.verified]);

  const load = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const req = await getMyVerificationRequest(user.uid);
      setExistingReq(req);

      // Pre-fill form if request exists
      if (req) {
        setPhone(req.phone || "");
        if (req.bloodGroup && BLOOD_GROUPS.includes(req.bloodGroup)) {
          setBloodGroup(req.bloodGroup);
        }
        setAge(req.age ? String(req.age) : "");
        if (req.lastDonationDate) {
          const parsed = new Date(req.lastDonationDate);
          if (!Number.isNaN(parsed.getTime())) setLastDonationDate(parsed);
        }
        setCity(req.city || "");
        setNotes(req.notes || "");
      }
    } catch (e: any) {
      console.log("verify-donor load error:", e);
      Alert.alert("Error", e?.message ?? "Failed to load verification status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert("Login required", "Please login first.");
      router.push("/profile");
      return;
    }

    const ageNum = Number(age);

    if (!phone.trim()) return Alert.alert("Missing", "Please enter phone.");
    if (!bloodGroup) return Alert.alert("Missing", "Please select blood group.");
    if (!age.trim() || Number.isNaN(ageNum) || ageNum < 16 || ageNum > 70) {
      return Alert.alert("Invalid age", "Enter a valid age (16–70).");
    }
    if (!city.trim()) return Alert.alert("Missing", "Please enter city.");

    try {
      setSubmitting(true);
      await submitVerificationRequest(user.uid, {
        phone: phone.trim(),
        bloodGroup,
        age: ageNum,
        lastDonationDate: toYYYYMMDD(lastDonationDate),
        city: city.trim(),
        notes: notes.trim(),
      });
      Alert.alert(
        "Submitted",
        "Your verification request was submitted for admin review."
      );
      await load();
    } catch (e: any) {
      console.log("submit verification error:", e);
      Alert.alert("Error", e?.message ?? "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Not logged in UI
  if (!user?.uid) {
    return (
      <SafeAreaView style={g.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: theme.colors.text }]}>
            Donor Verification
          </Text>
        </View>

        <View style={styles.center}>
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            You must be logged in to submit a verification request.
          </Text>
          <Button title="Go to Login" onPress={() => router.push("/profile")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={g.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          Donor Verification
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
            Loading verification status...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Status: {statusLabel}
            </Text>

            {existingReq?.status === "rejected" && existingReq.reviewReason ? (
              <Text style={[styles.rejected, { color: theme.colors.textSecondary }]}>
                Reason: {existingReq.reviewReason}
              </Text>
            ) : null}

            {profileData?.verified ? (
              <Text style={[styles.ok, { color: theme.colors.textSecondary }]}>
                You are verified. You can still update and resubmit if required.
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Submit Details
            </Text>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Blood Group
            </Text>
            <View
              style={[
                styles.pickerWrap,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <Picker
                selectedValue={bloodGroup}
                onValueChange={(v) => setBloodGroup(String(v))}
                style={{ color: theme.colors.text }}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <Picker.Item key={bg} label={bg} value={bg} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Age
            </Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 21"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Last Donation Date
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <Text style={{ color: theme.colors.text }}>
                {toYYYYMMDD(lastDonationDate)}
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>Change</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={lastDonationDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                  if (selectedDate) setLastDonationDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}

            {Platform.OS === "ios" && showDatePicker ? (
              <TouchableOpacity
                style={[
                  styles.iosDone,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Done</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g. kathmandu"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any extra details for admin..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              style={[
                styles.textarea,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <View style={{ height: 12 }} />

            <Button
              title={submitting ? "Submitting..." : "Submit Verification Request"}
              onPress={handleSubmit}
              disabled={submitting}
              fullWidth
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  back: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  note: { marginTop: 10, fontSize: 13, textAlign: "center" },

  content: { padding: 16, gap: 14 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8 },
  rejected: { fontSize: 12, marginTop: 6 },
  ok: { fontSize: 12, marginTop: 6 },

  label: { fontSize: 12, marginTop: 10, marginBottom: 6, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    textAlignVertical: "top",
  },

  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },

  dateBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iosDone: {
    marginTop: 10,
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});