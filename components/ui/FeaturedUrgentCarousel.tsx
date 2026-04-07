import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import { createGlobalStyles } from "@/styles/globalStyles";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FeaturedUrgentCarousel() {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated && !!user?.uid;

  const { displayRequests } = useBloodRequests(enabled);

  const urgent = useMemo(
    () => displayRequests.filter((r: any) => (r as any).urgent === true).slice(0, 6),
    [displayRequests]
  );

  // animation value used for pulsing overlay + slight scale
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // interpolations
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.12, 0],
  });

  if (!urgent || urgent.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, gstyles.text]}>Urgent Needs</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/requests")}>
          <Text style={[gstyles.textSecondary, styles.viewAll]}>View all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={urgent}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 6 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={{ marginRight: 10 }}
            onPress={() => router.push({ pathname: "/request-details/[id]", params: { id: item.id } })}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.danger,
                  borderColor: theme.colors.danger,
                  transform: [{ scale }],
                },
              ]}
            >
              {/* pulsing translucent layer */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: theme.colors.danger,
                    opacity: pulseOpacity,
                    borderRadius: 12,
                  },
                ]}
              />

              <Text style={styles.blood}>{item.bloodType}</Text>
              <Text style={styles.loc}>{item.location}</Text>
              <Text style={styles.time}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ""}
              </Text>
            </Animated.View>

            {/* small indicator (dot) below the card for emphasis */}
            <View style={styles.indicatorRow}>
              <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 8,
  },
  header: { fontSize: 18, fontWeight: "900" },
  viewAll: { fontSize: 12, fontWeight: "800" },
  card: {
    width: 200,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
    // subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  blood: { color: "#fff", fontSize: 20, fontWeight: "900" },
  loc: { color: "#fff", fontSize: 12, marginTop: 6 },
  time: { color: "rgba(255,255,255,0.95)", fontSize: 11, marginTop: 8 },
  indicatorRow: { alignItems: "center", marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 8 },
});