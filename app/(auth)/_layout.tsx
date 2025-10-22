import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();
  const segments = useSegments();

  // Allow profile-setup to be accessible even when signed in
  // This is needed because the session is activated before profile setup
  const isOnProfileSetup = segments[segments.length - 1] === "profile-setup";

  if (isSignedIn && !isOnProfileSetup) {
    return <Redirect href={"/"} />;
  }

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
