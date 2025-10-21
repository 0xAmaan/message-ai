import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function HomeLayout() {
  const { isSignedIn } = useAuth();

  // Redirect to auth if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/phone-input" />;
  }

  return <Stack />;
}
