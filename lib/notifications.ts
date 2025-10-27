import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return null;
    }

    // Get the push token (for Expo Go testing, this works without projectId)
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "default-project-id",
      });
      console.log("Push token:", token.data);
      return token.data;
    } catch (tokenError) {
      console.warn(
        "Could not get push token, but notifications will still work locally:",
        tokenError,
      );
      // Return null but notifications still work locally (foreground/background)
      return null;
    }
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
};

// Schedule a local notification (for testing)
export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: any,
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });
};
