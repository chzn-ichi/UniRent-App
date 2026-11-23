import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={icon} size={size} color={color} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#60A5FA",
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#0B1B38",
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab("Dashboard", "grid-outline")} />
      <Tabs.Screen name="borrow" options={tab("Borrow", "cube-outline")} />
      <Tabs.Screen name="rentals" options={tab("My rentals", "list-outline")} />
      <Tabs.Screen
        name="penalties"
        options={tab("Penalties", "cash-outline")}
      />
    </Tabs>
  );
}
