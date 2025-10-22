import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MessageCircle } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#8B5CF6", // violet-500
          tabBarInactiveTintColor: "#9CA3AF", // gray-400
          tabBarStyle: {
            backgroundColor: "#1F2937", // gray-800
            borderTopWidth: 1,
            borderTopColor: "#374151", // gray-700
          },
          headerStyle: {
            backgroundColor: "#1F2937", // gray-800
          },
          headerTintColor: "#F9FAFB", // gray-50
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown: false, // We handle headers in individual screens
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      </Tabs>
    </>
  );
}
