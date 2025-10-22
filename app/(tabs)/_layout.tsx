import { Tabs } from "expo-router";
import { View } from "react-native";
import { COLORS } from "../../lib/constants";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: size * 0.7,
                  height: size * 0.7,
                  backgroundColor: color,
                  borderRadius: size * 0.35,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
