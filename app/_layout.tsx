import { api } from "@/convex/_generated/api";
import { registerForPushNotifications } from "@/lib/notifications";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const updateOnlineStatus = useMutation(api.users.updateOnlineStatus);

  // Update online status based on app state
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    // Set initial online status
    updateOnlineStatus({ clerkId: user.id, isOnline: true });

    // Listen to app state changes
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        updateOnlineStatus({ clerkId: user.id, isOnline: true });
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        updateOnlineStatus({ clerkId: user.id, isOnline: false });
      }
    });

    // Cleanup: set offline when unmounting
    return () => {
      subscription.remove();
      updateOnlineStatus({ clerkId: user.id, isOnline: false });
    };
  }, [isSignedIn, user?.id, updateOnlineStatus]);

  // Set up push notifications
  useEffect(() => {
    if (isSignedIn) {
      registerForPushNotifications();

      // Listen for notifications received while app is in foreground
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

      // Listen for notification interactions (user tapped notification)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          // You can navigate to specific chat here based on notification data
          const conversationId =
            response.notification.request.content.data?.conversationId;
          if (conversationId) {
            router.push(`/chat/${conversationId}` as any);
          }
        });

      return () => {
        try {
          if (notificationListener.current) {
            notificationListener.current.remove();
          }
          if (responseListener.current) {
            responseListener.current.remove();
          }
        } catch (error) {
          console.log("Error cleaning up notifications:", error);
        }
      };
    }
  }, [isSignedIn, router]);

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
        headerStyle: { backgroundColor: "#1F2937" },
        headerTintColor: "#F9FAFB",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#111827" },
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
