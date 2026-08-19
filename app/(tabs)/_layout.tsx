import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { colors } from "@/components/case-ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <MaterialIcons name="space-dashboard" size={23} color={color} /> }} />
      <Tabs.Screen name="evidence" options={{ title: "Evidence", tabBarIcon: ({ color }) => <MaterialIcons name="fact-check" size={23} color={color} /> }} />
      <Tabs.Screen name="timeline" options={{ title: "Timeline", tabBarIcon: ({ color }) => <MaterialIcons name="timeline" size={24} color={color} /> }} />
      <Tabs.Screen name="queue" options={{ title: "Queue", tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={23} color={color} /> }} />
    </Tabs>
  );
}
