import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { createGlobalStyles } from "@/styles/globalStyles";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function RequestsSearchBar({ value, onChange, placeholder = "Search requests (location, desc, name)..." }: Props) {
  const { theme } = useTheme();
  const gstyles = createGlobalStyles(theme);
  const [local, setLocal] = useState(value);

  // basic debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <TextInput
        value={local}
        onChangeText={setLocal}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, gstyles.text]}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 14,
  },
});