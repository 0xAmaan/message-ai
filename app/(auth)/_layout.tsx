import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AuthRoutesLayout = () => {
  // No redirect logic here - the root layout handles all routing
  // This allows the auth flow to complete without interference

  return (
    <>
      <StatusBar style="light" backgroundColor="#1A1A1A" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1A1A1A" },
          headerTintColor: "#F9FAFB", // gray-50
          // headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#000000" }, // background-base
        }}
      >
      <Stack.Screen
        name="phone-input"
        options={{ title: "MessageAI", headerShown: true }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="username-setup"
        options={{
          title: "Choose Username",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          title: "Complete Profile",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      </Stack>
    </>
  );
};

export default AuthRoutesLayout;
