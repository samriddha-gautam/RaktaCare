import FeaturedUrgentCarousel from "@/components/ui/FeaturedUrgentCarousel";
import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import RecentRequestsPreview from "@/components/ui/RecentRequestsPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

const ActionButton = ({ title, onPress, variant = "secondary" }: ActionButtonProps) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        local.actionBtn,
        variant === "primary"
          ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
          : { backgroundColor: "transparent", borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          local.actionBtnText,
          variant === "primary" ? { color: "#fff" } : { color: theme.colors.text },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const RequestsTab = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const { isAuthenticated, profileData } = useAuth();
  const isAdmin = profileData?.role === "admin";
  const isVerifiedDonor = profileData?.verified === true;

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

  const requireLogin = (next: () => void) => {
    if (!isAuthenticated) {
      Alert.alert("Please log in", "Log in to continue.");
      return;
    }
    next();
  };

  const actions = useMemo(
    () => [
      {
        title: "Create Request",
        variant: "primary" as const,
        onPress: () => requireLogin(() => router.push("/(tabs)/add")),
      },
      {
        title: "Open Maps",
        onPress: () => requireLogin(() => router.push("/nearby")),
      },
      {
        title: "My Requests",
        onPress: () => requireLogin(() => router.push("/my-requests")),
      },
      {
        title: "Location Services",
        onPress: () => router.push("/location-services"),
      },
    ],
    [isAuthenticated]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header ref={headerRef} headerHeight={DEFAULT_HEADER_HEIGHT} />

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: DEFAULT_HEADER_HEIGHT,
          paddingBottom: 24,
        }}
      >
        <View style={local.container}>
          {/* HERO */}
          <View
            style={[
              local.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[local.title, { color: theme.colors.text }]}>
              Requests Hub
            </Text>
            <Text style={[local.subtitle, { color: theme.colors.textSecondary }]}>
              Create and manage requests, verify donors, and use location tools.
            </Text>

            <View style={local.actionsGrid}>
              {actions.map((a) => (
                <ActionButton
                  key={a.title}
                  title={a.title}
                  onPress={a.onPress}
                  variant={a.variant}
                />
              ))}
            </View>
          </View>

          {/* Featured urgent carousel */}
          <FeaturedUrgentCarousel />

          {/* Recent Requests preview (top 3 + stats) */}
          <RecentRequestsPreview />

          {/* DONOR CTA */}
          {!isVerifiedDonor && (
            <View
              style={[
                local.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[local.sectionTitle, { color: theme.colors.text }]}>
                Become a Verified Donor
              </Text>
              <Text style={[local.small, { color: theme.colors.textSecondary }]}>
                Verified donors get trusted status and can receive urgent matching alerts.
              </Text>

              <ActionButton
                title="Start Donor Verification"
                onPress={() => requireLogin(() => router.push("/verify-donor"))}
                variant="primary"
              />
            </View>
          )}

          {/* ADMIN */}
          {isAdmin && (
            <View
              style={[
                local.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[local.sectionTitle, { color: theme.colors.text }]}>
                Admin Tools
              </Text>
              <Text style={[local.small, { color: theme.colors.textSecondary }]}>
                Review pending donor verification requests.
              </Text>

              <ActionButton
                title="Verification Requests"
                onPress={() => router.push("/admin/verifications")}
                variant="primary"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RequestsTab;

const local = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14, paddingBottom: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 16, marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  small: { fontSize: 12, lineHeight: 16, marginBottom: 12 },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: "48%",
    alignItems: "center",
  },
  actionBtnText: { fontWeight: "800" },
});