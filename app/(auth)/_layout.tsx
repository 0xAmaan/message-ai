import { Stack } from "expo-router";

export default function AuthRoutesLayout() {
  // No redirect logic here - the root layout handles all routing
  // This allows the auth flow to complete without interference

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1F2937" },
        headerTintColor: "#F9FAFB", // gray-50
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#111827" }, // gray-900
      }}
    >
      <Stack.Screen
        name="phone-input"
        options={{ title: "Enter Phone Number", headerShown: true }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{ title: "Verify Code", headerShown: true }}
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
  );
}
