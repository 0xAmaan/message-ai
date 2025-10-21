import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "./global.css";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
    );
  }

  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    throw new Error(
      "Missing Convex URL. Please set EXPO_PUBLIC_CONVEX_URL in your .env"
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
          {/* <Stack.Screen name="chat/[id]" options={{ headerShown: false }} /> */}
        </Stack>
      </ConvexProviderWithClerk>
      {/* <StatusBar style="auto" /> */}
    </ClerkProvider>
  );
}
