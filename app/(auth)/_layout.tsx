import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
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
        name="profile-setup"
        options={{
          title: "Complete Profile",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
