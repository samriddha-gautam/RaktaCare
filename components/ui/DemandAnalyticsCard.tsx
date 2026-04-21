import { useTheme } from "@/contexts/ThemeContext";
import { BloodRequest } from "@/hooks/useBloodRequests";
import { createGlobalStyles } from "@/styles/globalStyles";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

type Props = {
  requests?: BloodRequest[]; // <-- optional now
};

const getDateKey = (d: Date) => d.toISOString().slice(0, 10);

const rarityWeight = (blood: string) => {
  if (blood === "O-" || blood === "AB-") return 6;
  if (blood === "B-" || blood === "A-") return 4;
  return 2;
};

const urgencyScore = (r: any) => {
  const created = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
  const ageHours = Math.max(1, (Date.now() - created.getTime()) / (1000 * 60 * 60));
  const rarity = rarityWeight(r.bloodType || "");
  const urgentBonus = r.urgent ? 8 : 0;
  return Math.round(ageHours * 0.6 + rarity * 2 + urgentBonus);
};

export default function DemandAnalyticsCard({ requests = [] }: Props) {
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);
  const safe = requests ?? [];

  const analytics = useMemo(() => {
    const now = new Date();
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      last7Days.push(getDateKey(date));
    }

    const countsByDate: Record<string, number> = {};
    const countsByBlood: Record<string, number> = {};

    safe.forEach((r) => {
      const t = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt as any);
      const key = getDateKey(t);
      if (last7Days.includes(key)) countsByDate[key] = (countsByDate[key] || 0) + 1;
      if (r.bloodType) countsByBlood[r.bloodType] = (countsByBlood[r.bloodType] || 0) + 1;
    });

    const trendData = last7Days.map((d) => countsByDate[d] || 0);

    let mostNeeded = "";
    let maxCount = 0;
    Object.entries(countsByBlood).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostNeeded = type;
      }
    });

    const active = safe.filter((r) => r.status === "active").length;
    const completed = safe.filter((r) => r.status === "completed").length;

    const urgentRank = [...safe]
      .filter((r) => r.status === "active")
      .map((r: any) => ({ r, score: urgencyScore(r) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const avgUrgency =
      urgentRank.length > 0
        ? Math.round(urgentRank.reduce((sum, u) => sum + u.score, 0) / urgentRank.length)
        : 0;

    return {
      trendLabels: last7Days.map((d) => d.slice(5)),
      trendData,
      mostNeeded,
      active,
      completed,
      total: safe.length,
      urgentRank,
      avgUrgency,
    };
  }, [safe]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={[styles.title, g.text]}>Demand Analytics (7 Days)</Text>

      <View style={styles.statsRow}>
        <Text style={[g.textSecondary]}>Total: {analytics.total}</Text>
        <Text style={[g.textSecondary]}>Active: {analytics.active}</Text>
        <Text style={[g.textSecondary]}>Completed: {analytics.completed}</Text>
      </View>

      <Text style={[styles.mostNeeded, g.text]}>
        Most Needed:{" "}
        <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>
          {analytics.mostNeeded || "N/A"}
        </Text>
      </Text>

      <LineChart
        data={{
          labels: analytics.trendLabels,
          datasets: [{ data: analytics.trendData }],
        }}
        width={screenWidth - 32}
        height={200}
        yAxisLabel=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: () => theme.colors.primary,
          labelColor: () => theme.colors.textSecondary,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: theme.colors.primary,
          },
        }}
        bezier
        style={styles.chart}
      />

      <View style={styles.urgencyBox}>
        <Text style={[styles.urgencyTitle, g.text]}>Urgency Score (Top 3)</Text>
        <Text style={[g.textSecondary]}>
          Avg Score:{" "}
          <Text style={{ color: theme.colors.danger, fontWeight: "900" }}>
            {analytics.avgUrgency}
          </Text>
        </Text>

        {analytics.urgentRank.length === 0 ? (
          <Text style={[g.textSecondary, { marginTop: 6 }]}>
            No active requests to rank.
          </Text>
        ) : (
          analytics.urgentRank.map(({ r, score }, idx) => (
            <Text key={r.id} style={[g.textSecondary, { marginTop: 4 }]}>
              #{idx + 1} {r.bloodType} • {r.location} → Score {score}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  mostNeeded: { fontSize: 14, marginBottom: 8 },
  chart: { borderRadius: 12 },
  urgencyBox: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  urgencyTitle: { fontWeight: "900", marginBottom: 4 },
});