import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CircleUser, MessageCircle, Settings } from "lucide-react-native";
import { FloatingTabBar } from "@/components/FloatingTabBar";

const TabsLayout = () => {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
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
