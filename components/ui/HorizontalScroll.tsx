import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface HorizontalScrollProps {
  selectedBloodType?: string;
  onSelectBloodType?: (bloodType: string) => void;
  showTitle?: boolean;
}

const HorizontalScroll = ({ 
  selectedBloodType, 
  onSelectBloodType,
  showTitle = true 
}: HorizontalScrollProps) => {
  const { theme } = useTheme();

  const handlePress = (name: string) => {
    if (onSelectBloodType) {
      onSelectBloodType(name);
    }
  };

  return (
    <View style={styles.section}>
      {showTitle && (
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Blood Groups
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BLOOD_GROUPS.map((group) => {
          const isSelected = selectedBloodType === group;
          return (
            <TouchableOpacity
              onPress={() => handlePress(group)}
              key={group}
              activeOpacity={0.75}
              style={[
                styles.categoryCard,
                { 
                  backgroundColor: theme.colors.primary,
                  opacity: selectedBloodType 
                    ? (isSelected ? 1 : 0.45)
                    : 1,
                  ...(isSelected
                    ? {
                        transform: [{ scale: 1.05 }],
                        ...(theme.shadow.md as any),
                      }
                    : {}),
                },
              ]}
            >
              <Text style={styles.categoryName}>{group}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    width: 80,
    height: 64,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HorizontalScroll;