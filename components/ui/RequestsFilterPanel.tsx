import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type StatusFilter = "all" | "active" | "completed";
export type DateRange = "all" | "24h" | "3d" | "7d";

interface Props {
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  reset: () => void;
}

  /**
 * Chip
 */
const chip = (selected: boolean, theme: any) =>
  selected ? { backgroundColor: theme.colors.primary, color: "#fff" } : { backgroundColor: "transparent", borderColor: theme.colors.border };

export default function RequestsFilterPanel({ status, setStatus, dateRange, setDateRange, reset }: Props) {
  const { theme } = useTheme();
  const g = createGlobalStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[g.text, styles.label]}>Status</Text>
        <View style={styles.chips}>
          {(["all", "active", "completed"] as any[]).map((s) => {
            const selected = status === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selected ? { backgroundColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
                onPress={() => setStatus(s)}
              >
                <Text style={selected ? { color: "#fff", fontWeight: "800" } : [g.text, { fontWeight: "800" }]}>
                  {s === "all" ? "All" : s === "active" ? "Active" : "Completed"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        <Text style={[g.text, styles.label]}>Date</Text>
        <View style={styles.chips}>
          {(["24h", "3d", "7d", "all"] as DateRange[]).map((d) => {
            const selected = dateRange === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, selected ? { backgroundColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
                onPress={() => setDateRange(d)}
              >
                <Text style={selected ? { color: "#fff", fontWeight: "800" } : [g.text, { fontWeight: "800" }]}>
                  {d === "24h" ? "24h" : d === "3d" ? "3d" : d === "7d" ? "7d" : "All"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={reset}>
          <Text style={[g.textSecondary, { fontWeight: "800" }]}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, marginHorizontal: 16, paddingBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontWeight: "800" },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  actions: { marginTop: 10, alignItems: "flex-end" },
});