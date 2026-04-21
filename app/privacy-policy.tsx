import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIVACY_SECTIONS = [
  {
    title: "1. Introduction",
    content:
      'RaktaCare ("we", "us", "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ("App").\n\nBy using RaktaCare, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of the App immediately.',
  },
  {
    title: "2. Information We Collect",
    subsections: [
      {
        subtitle: "a. Personal Information",
        items: [
          "Full name, date of birth, and gender",
          "Email address and phone number",
          "Blood type and Rh factor",
        ],
      },
      {
        subtitle: "b. Health & Donation Data",
        items: [
          "Donation history and frequency",
          "Medical eligibility information",
          "Last donation date and type",
          "Donation reminder preferences",
        ],
      },
      {
        subtitle: "c. Location Data",
        items: [
          "Approximate location (for nearby blood banks & donation centers)",
          "Location is only collected when you grant permission",
        ],
      },
      {
        subtitle: "d. Device & Usage Data",
        items: [
          "Device type, operating system, and version",
          "App usage analytics (screens visited, features used)",
          "Crash logs and performance data",
          "IP address and unique device identifiers",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    items: [
      "Match you with nearby blood donation centers and requests",
      "Schedule appointments and send donation reminders",
      "Track your donation history and eligibility",
      "Send important notifications about urgent blood needs",
      "Improve app performance and user experience",
      "Comply with legal and regulatory obligations",
      "Conduct anonymized research to improve blood donation services",
    ],
  },
  {
    title: "4. How We Share Your Information",
    content:
      "We do NOT sell your personal information. We may share your data only in the following cases:",
    items: [
      "With blood banks and hospitals — only donation-related information necessary to process your donation",
      "With service providers — cloud hosting, analytics, and notification services (bound by strict confidentiality agreements)",
      "For legal compliance — when required by law, court order, or government authority",
      "Emergency situations — if sharing is necessary to prevent harm or protect safety",
      "Business transfers — in case of merger or acquisition, you will be notified beforehand",
    ],
  },
  {
    title: "5. Data Storage & Security",
    content:
      "We take the security of your data seriously and implement industry-standard measures to protect it:",
    items: [
      "All data is encrypted in transit (TLS/SSL) and at rest (AES-256)",
      "Authentication is handled securely via Firebase Authentication",
      "Access to personal data is restricted to authorized personnel only",
      "We conduct regular security audits and vulnerability assessments",
      "Passwords are hashed and never stored in plain text",
    ],
  },
  {
    title: "6. Your Rights & Choices",
    content:
      "You have the following rights regarding your personal data:",
    items: [
      "Access — Request a copy of all personal data we hold about you",
      "Correction — Update or correct inaccurate information",
      "Deletion — Request deletion of your account and all associated data",
      "Portability — Receive your data in a structured, machine-readable format",
      "Withdraw Consent — Opt out of data collection at any time",
      "Restrict Processing — Limit how we use your data",
      "Object — Object to processing for certain purposes",
    ],
    footer:
      'To exercise any of these rights, go to Settings → Account → "Delete Account" or contact us at the email below.',
  },
  {
    title: "7. Data Retention",
    content:
      "We retain your personal data for as long as your account is active or as needed to provide services. Specifically:\n\n• Account data: Retained until you delete your account\n• Donation history: Retained for up to 10 years (as required by health regulations)\n• Analytics data: Retained in anonymized form indefinitely\n• Crash logs: Automatically deleted after 90 days\n\nWhen you delete your account, we will remove your personal data within 30 days, except where retention is required by law.",
  },
  {
    title: "8. Third-Party Services",
    content: "RaktaCare uses the following third-party services:",
    items: [
      "Firebase (Google) — Authentication, database, and analytics",
      "Expo — App updates and push notifications",
      "AsyncStorage — Local data storage on your device",
    ],
    footer:
      "Each third-party service has its own privacy policy. We encourage you to review them.",
  },
  {
    title: "9. Children's Privacy",
    content:
      "RaktaCare is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If we discover that a child under 16 has provided us with personal information, we will delete it immediately.\n\nIf you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately.",
  },
  {
    title: "10. Push Notifications",
    content:
      "We may send you push notifications for:\n\n• Donation reminders based on your eligibility schedule\n• Urgent blood requests in your area\n• Appointment confirmations and updates\n• Important app updates\n\nYou can manage or disable push notifications at any time through your device settings or within the App under Settings → Notifications.",
  },
  {
    title: "11. Location Services",
    content:
      "We use location data solely to:\n\n• Show nearby blood donation centers\n• Display blood requests in your area\n• Calculate distance to donation sites\n\nLocation data is never stored permanently on our servers. You can disable location services at any time in your device settings. The app will continue to function with reduced location-based features.",
  },
  {
    title: "12. Changes to This Policy",
    content:
      'We may update this Privacy Policy from time to time. We will notify you of any material changes by:\n\n• Displaying a notice in the App\n• Sending a push notification\n• Updating the "Last Updated" date at the top\n\nContinued use of the App after changes constitutes acceptance of the updated policy.',
  },
  {
    title: "13. Contact Us",
    content:
      "If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:\n\n📧 Email: privacy@raktacare.com\n📍 Address: RaktaCare Team, Nepal\n\nWe will respond to all requests within 30 days.",
  },
];

const PrivacyPolicy: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const router = useRouter();

  /**
   * Render bullet item
   */
  const renderBulletItem = (item: string, index: number) => (
    <View key={index} style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
      <Text style={[styles.bulletText, { color: theme.colors.text }]}>
        {item}
      </Text>
    </View>
  );

  const renderSection = (section: (typeof PRIVACY_SECTIONS)[0], index: number) => (
    <View key={index} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>

      {section.content && (
        <Text style={[styles.paragraph, { color: theme.colors.text }]}>
          {section.content}
        </Text>
      )}

      {section.subsections &&
        section.subsections.map((sub, subIndex) => (
          <View key={subIndex} style={styles.subsection}>
            <Text
              style={[styles.subsectionTitle, { color: theme.colors.text }]}
            >
              {sub.subtitle}
            </Text>
            {sub.items.map((item, itemIndex) => renderBulletItem(item, itemIndex))}
          </View>
        ))}

      {section.items && section.items.map((item, itemIndex) => renderBulletItem(item, itemIndex))}

      {section.footer && (
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          {section.footer}
        </Text>
      )}
    </View>
  );

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
          Privacy Policy
        </Text>

        {/* Last Updated Badge */}
        <View
          style={[
            styles.updatedBadge,
            { backgroundColor: theme.colors.primary + "15" },
          ]}
        >
          <Text style={[styles.updatedText, { color: theme.colors.primary }]}>
            📋 Last Updated: March 11, 2026
          </Text>
        </View>

        {/* App Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            🩸 RaktaCare
          </Text>
          <Text
            style={[styles.infoSubtitle, { color: theme.colors.textSecondary }]}
          >
            Blood Donation Management App
          </Text>
          <Text style={[styles.infoBody, { color: theme.colors.textSecondary }]}>
            Your privacy matters to us. This policy explains what data we
            collect, why we collect it, and how you can control it.
          </Text>
        </View>

        {/* Quick Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.summaryTitle}>🔒 Quick Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>✅</Text>
            <Text style={styles.summaryText}>
              We never sell your personal data
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>✅</Text>
            <Text style={styles.summaryText}>
              Your health data is encrypted & secure
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>✅</Text>
            <Text style={styles.summaryText}>
              You can delete your account anytime
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>✅</Text>
            <Text style={styles.summaryText}>
              Location is only used with your permission
            </Text>
          </View>
        </View>

        {/* All Sections */}
        {PRIVACY_SECTIONS.map((section, index) => renderSection(section, index))}

        {/* Contact Button */}
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => Linking.openURL("mailto:privacy@raktacare.com")}
        >
          <Text style={styles.contactButtonText}>
            📧 Contact Us About Privacy
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.footerNote, { color: theme.colors.textSecondary }]}
        >
          This privacy policy is inspired by industry standards followed by apps
          like Red Cross Blood Donor, NHS Give Blood, and other health-related
          applications.
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
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 10,
  },
  updatedBadge: {
    alignSelf: "flex-start",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  updatedText: { fontSize: 13, fontWeight: "600" },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 20, fontWeight: "700" },
  infoSubtitle: { fontSize: 14, marginTop: 2 },
  infoBody: { fontSize: 14, marginTop: 10, lineHeight: 20 },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  summaryEmoji: { fontSize: 14, marginRight: 10 },
  summaryText: { color: "#ffffffdd", fontSize: 14, fontWeight: "500", flex: 1 },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  subsection: { marginTop: 10, marginBottom: 6 },
  subsectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  bullet: { fontSize: 16, marginRight: 10, marginTop: 1 },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
  footerText: { fontSize: 13, fontStyle: "italic", marginTop: 8, lineHeight: 18 },
  contactButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  contactButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footerNote: {
    fontSize: 11,
    textAlign: "center",
    marginHorizontal: 30,
    marginTop: 20,
    lineHeight: 16,
  },
});

export default PrivacyPolicy;