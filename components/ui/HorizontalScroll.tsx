import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import React from "react";
import { createGlobalStyles } from "@/styles/globalStyles";
import { useTheme } from "@/contexts/ThemeContext";

const categories = [
  { id: 1, name: "A+", color: "#FF6B6B" },
  { id: 2, name: "A-", color: "#FF6B6B" },
  { id: 3, name: "B+", color: "#FF6B6B" },
  { id: 4, name: "B-", color: "#FF6B6B" },
  { id: 5, name: "AB+", color: "#FF6B6B" },
  { id: 6, name: "AB-", color: "#FF6B6B" },
  { id: 7, name: "O+", color: "#FF6B6B" },
  { id: 8, name: "O-", color: "#FF6B6B" },
];

const HorizontalScroll = () => {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle,gstyles.text]}>Blood Groups</Text>
      <ScrollView horizontal>
        {categories.map((category) => (
          <TouchableOpacity
            onPress={()=>console.log(category.name + " Blood group")}
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: category.color }]}
          >
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
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
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  categoryCard: {
    width: 100,
    height: 80,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 20,
  },
  categoryName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  
});

export default HorizontalScroll;