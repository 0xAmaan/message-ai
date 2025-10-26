import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CircleUser, MessageCircle, Settings } from "lucide-react-native";
import { BlurView } from "expo-blur";

const TabsLayout = () => {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#3D88F7", // blue
          tabBarInactiveTintColor: "#9CA3AF", // gray-400
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#1A1A1A",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.1)",
            height: 85,
            paddingBottom: 25,
          },
          headerStyle: {
            backgroundColor: "#1A1A1A",
          },
          headerTintColor: "#F9FAFB",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color, size }) => (
              <CircleUser color={color} size={size} strokeWidth={2} />
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
};

export default TabsLayout;
