import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isOnNewChat = segments[0] === "new-chat";
    const isOnChat = segments[0] === "chat";

    console.log("Auth state:", {
      isSignedIn,
      segments,
      inAuthGroup,
      inTabsGroup,
    });

    // Allow authenticated routes: tabs, new-chat, chat
    const isInAuthenticatedRoute = inTabsGroup || isOnNewChat || isOnChat;

    if (isSignedIn && !isInAuthenticatedRoute) {
      // Redirect signed-in users to tabs
      router.replace("/(tabs)");
    } else if (!isSignedIn && !inAuthGroup) {
      // Redirect signed-out users to auth
      router.replace("/(auth)/phone-input");
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1F2937", // gray-800
        },
        headerTintColor: "#F9FAFB", // gray-50
        headerTitleStyle: {
          fontWeight: "bold",
        },
        contentStyle: {
          backgroundColor: "#111827", // gray-900
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: "Chat",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="new-chat"
        options={{
          headerShown: true,
          title: "New Chat",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
    );
  }

  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    throw new Error(
      "Missing Convex URL. Please set EXPO_PUBLIC_CONVEX_URL in your .env",
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <RootLayoutNav />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
