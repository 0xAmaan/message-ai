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

const RootLayoutNav = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const heartbeat = useMutation(api.users.heartbeat);
  const updateOnlineStatus = useMutation(api.users.updateOnlineStatus);

  // Heartbeat system: ping server every 15 seconds while app is active
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    console.log("[Heartbeat] Starting heartbeat for user:", user.id);

    // Send initial heartbeat
    heartbeat({ clerkId: user.id });

    // Set up interval for heartbeat (every 15 seconds)
    const heartbeatInterval = setInterval(() => {
      const appState = AppState.currentState;
      if (appState === "active") {
        console.log("[Heartbeat] Sending heartbeat ping");
        heartbeat({ clerkId: user.id });
      }
    }, 15000); // 15 seconds

    // Listen to app state changes
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log("[Heartbeat] App state changed to:", nextAppState);
      if (nextAppState === "active") {
        // Send heartbeat immediately when returning to foreground
        heartbeat({ clerkId: user.id });
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // Set offline when going to background (best effort)
        updateOnlineStatus({ clerkId: user.id, isOnline: false });
      }
    });

    // Cleanup
    return () => {
      console.log("[Heartbeat] Cleaning up heartbeat for user:", user.id);
      clearInterval(heartbeatInterval);
      subscription.remove();
      // Best-effort offline status (may not execute if app is force-quit)
      updateOnlineStatus({ clerkId: user.id, isOnline: false });
    };
  }, [isSignedIn, user?.id, heartbeat, updateOnlineStatus]);

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
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new-chat" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayout = () => {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <RootLayoutNav />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
