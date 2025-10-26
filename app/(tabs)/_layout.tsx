import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MessageCircle, Settings, Users } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#8B5CF6", // violet-500
          tabBarInactiveTintColor: "#9CA3AF", // gray-400
          tabBarStyle: {
            backgroundColor: "#1A1A1A", // lighter dark gray
            borderTopWidth: 1,
            borderTopColor: "#1A1A1A", // lighter dark gray
          },
          headerStyle: {
            backgroundColor: "#1A1A1A", // lighter dark gray
          },
          headerTintColor: "#F9FAFB", // gray-50
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown: false, // We handle headers in individual screens
        }}
      >
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color, size }) => (
              <Users color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Settings color={color} size={size} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
