import { Tabs } from "expo-router";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  const { theme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon : ({color, focused})=>(
            <AntDesign name="home" size={24} color={color} />
          )
        }}
        
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon:({color,focused})=>(
            <Ionicons name="add-circle" size={30} color={color}/>
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon:({color,focused})=>(
            <Ionicons name="settings" size={24} color={color}/>
          )
        }}
      />
    </Tabs>
  );
}