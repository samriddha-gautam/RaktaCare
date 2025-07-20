// components/AnimatedHeader.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { useAnimatedHeader } from "@/hooks/useAnimatedHeader";

const HEADER_HEIGHT = 150;

interface AnimatedHeaderProps {
  headerHeight?: number;
  hideThreshold?: number;
  showThreshold?: number;
  animationDuration?: number;
  onHeaderHookReady?: (hookMethods: ReturnType<typeof useAnimatedHeader>) => void;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({ 
  headerHeight = HEADER_HEIGHT,
  hideThreshold,
  showThreshold,
  animationDuration,
  onHeaderHookReady
}) => {
  const { theme } = useTheme();
  
  const headerHook = useAnimatedHeader({
    headerHeight,
    hideThreshold,
    showThreshold,
    animationDuration,
  });

  const navigateToProfile = () => {
    router.push("/profile");
  };

  // Pass the hook methods to parent if callback provided
  React.useEffect(() => {
    if (onHeaderHookReady) {
      onHeaderHookReady(headerHook);
    }
  }, [onHeaderHookReady, headerHook]);

  return (
    <Animated.View
      style={[
        headerStyles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border || "#e0e0e0",
          height: headerHeight,
          transform: [{ translateY: headerHook.headerTranslateY }],
        },
      ]}
    >
      <View style={headerStyles.headerContent}>
        {/* Profile Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
          onPress={navigateToProfile}
        >
          <Image 
            source={{ uri: 'https://via.placeholder.com/55x55/007AFF/FFFFFF?text=U' }}
            style={headerStyles.profileImage} 
          />
          <Text 
            style={[
              { fontSize: 16, fontWeight: "bold" }, 
              { color: theme.colors.text }
            ]}
          >
            UserName
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Export the default header height
export const HEADER_HEIGHT_EXPORT = HEADER_HEIGHT;

const headerStyles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
});

export default AnimatedHeader;