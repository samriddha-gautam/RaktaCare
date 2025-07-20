import { Tabs } from "expo-router";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AntDesign from '@expo/vector-icons/AntDesign';

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
          title: "",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarIcon:({color,focused})=>(
            <AntDesign name="appstore-o" size={24} color={color}/>
          )
        }}
      />
    </Tabs>
  );
}