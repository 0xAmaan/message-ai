import { Stack } from "expo-router";

export default function AuthRoutesLayout() {
  // No redirect logic here - the root layout handles all routing
  // This allows the auth flow to complete without interference

  return (
    <Stack>
      <Stack.Screen
        name="phone-input"
        options={{
          title: "Enter Phone Number",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{
          title: "Verify Code",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="username-setup"
        options={{
          title: "Choose Username",
          headerShown: true,
          headerBackVisible: false, // Prevent going back after OTP verification
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          title: "Complete Profile",
          headerShown: true,
          headerBackVisible: false, // Prevent going back after username is set
        }}
      />
    </Stack>
  );
}
