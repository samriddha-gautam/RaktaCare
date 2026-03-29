import Header, { DEFAULT_HEADER_HEIGHT, HeaderRef } from "@/components/ui/Header";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import React, { useCallback, useRef } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RequestsTab = () => {
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);
  const headerRef = useRef<HeaderRef>(null);

  const handleScroll = useCallback((event: any) => {
    headerRef.current?.handleScroll(event);
  }, []);

  return (
    <SafeAreaView style={[styles.container]}>
      <Header ref={headerRef} headerHeight={DEFAULT_HEADER_HEIGHT} />

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: DEFAULT_HEADER_HEIGHT, paddingBottom: 24 }}
      >
        <View style={local.container}>
          {/* HERO */}
          <View style={[local.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[local.title, { color: theme.colors.text }]}>Requests Hub</Text>
            <Text style={[local.subtitle, { color: theme.colors.textSecondary }]}>
              Find blood requests, manage donor settings, and take action quickly.
            </Text>

            <View style={local.row}>
              <TouchableOpacity
                style={[local.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/(tabs)/add")}
              >
                <Text style={local.primaryBtnText}>Create Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[local.secondaryBtn, { borderColor: theme.colors.border }]}
                onPress={() => router.push("/location-services")}
              >
                <Text style={[local.secondaryBtnText, { color: theme.colors.text }]}>Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTIVE REQUESTS (placeholder section) */}
          <View style={[local.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[local.sectionTitle, { color: theme.colors.text }]}>Active Requests</Text>
            <Text style={[local.small, { color: theme.colors.textSecondary }]}>
              (Next) Show nearby + matching blood group requests here.
            </Text>

            <TouchableOpacity
              style={[local.linkBtn, { borderColor: theme.colors.border }]}
              onPress={() => router.push("/(tabs)/add")}
            >
              <Text style={[local.linkBtnText, { color: theme.colors.text }]}>
                Add a request
              </Text>
            </TouchableOpacity>
          </View>

          {/* QUICK ACTIONS */}
          <View style={[local.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[local.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>

            <TouchableOpacity
              style={[local.linkBtn, { borderColor: theme.colors.border }]}
              onPress={() => router.push("/eligibility-settings")}
            >
              <Text style={[local.linkBtnText, { color: theme.colors.text }]}>Eligibility Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[local.linkBtn, { borderColor: theme.colors.border }]}
              onPress={() => router.push("/donation-reminders")}
            >
              <Text style={[local.linkBtnText, { color: theme.colors.text }]}>Donation Reminders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[local.linkBtn, { borderColor: theme.colors.border }]}
              onPress={() => router.push("/location-services")}
            >
              <Text style={[local.linkBtnText, { color: theme.colors.text }]}>Location Services</Text>
            </TouchableOpacity>
          </View>

          {/* NEARBY (placeholder) */}
          <View style={[local.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[local.sectionTitle, { color: theme.colors.text }]}>Nearby</Text>
            <Text style={[local.small, { color: theme.colors.textSecondary }]}>
              (Next) Add a list/map of nearby blood banks & hospitals here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RequestsTab;

const local = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  small: { fontSize: 12, lineHeight: 16 },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },

  primaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: "800" },

  linkBtn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  linkBtnText: { fontWeight: "700" },
});