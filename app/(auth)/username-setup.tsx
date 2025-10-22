import { api } from "@/convex/_generated/api";
import { useSignUp } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function UsernameSetupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const upsertUser = useMutation(api.users.upsertFromClerk);

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    // Basic username validation
    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        "Error",
        "Username can only contain letters, numbers, and underscores",
      );
      return;
    }

    try {
      setLoading(true);

      if (!isLoaded || !signUp) {
        Alert.alert("Error", "Sign up not initialized");
        return;
      }

      console.log("Updating sign-up with username:", username);

      // Update the sign-up with the username
      const updatedSignUp = await signUp.update({
        username: username.trim(),
      });

      console.log("Updated sign-up status:", updatedSignUp.status);
      console.log("Created session ID:", updatedSignUp.createdSessionId);
      console.log("Missing fields:", updatedSignUp.missingFields);

      // Check if sign-up is complete
      if (updatedSignUp.status === "complete") {
        if (updatedSignUp.createdSessionId) {
          // Set the session as active
          await setActive({ session: updatedSignUp.createdSessionId });
          console.log("Session activated with username!");

          // Get the user data from the sign-up
          const phoneNumber = updatedSignUp.phoneNumber || "";
          const clerkUserId = updatedSignUp.createdUserId;

          if (clerkUserId) {
            console.log("Creating initial user record in Convex...");

            // Create the user record in Convex immediately with username
            // This ensures the user exists in Convex even if they skip profile setup
            try {
              await upsertUser({
                clerkId: clerkUserId,
                phoneNumber: phoneNumber,
                name: username, // Use username as temporary name
              });

              console.log("User created in Convex successfully!");
            } catch (convexError: any) {
              console.error("Failed to create user in Convex:", convexError);
              // Don't block the flow if Convex fails - user can update later
            }
          }

          // Navigate to tabs - the root layout will handle the redirect
          router.replace("/(tabs)");
        } else {
          Alert.alert("Error", "Sign-up completed but session creation failed");
        }
      } else if (updatedSignUp.status === "missing_requirements") {
        // Still missing other requirements
        console.log(
          "Still missing fields after username:",
          updatedSignUp.missingFields,
        );
        Alert.alert(
          "Additional Information Required",
          `Please provide: ${updatedSignUp.missingFields?.join(", ") || "additional information"}`,
        );
      } else {
        console.error("Unexpected status:", updatedSignUp.status);
        Alert.alert("Error", "Unexpected sign-up status. Please try again.");
      }
    } catch (error: any) {
      console.error("Username setup error:", error);

      // Handle specific error codes
      if (error.errors?.[0]?.code === "form_identifier_exists") {
        Alert.alert(
          "Username Taken",
          "This username is already in use. Please choose another one.",
        );
      } else if (error.errors?.[0]?.code === "form_username_invalid_length") {
        Alert.alert(
          "Invalid Username",
          "Username must be between 3 and 20 characters.",
        );
      } else if (
        error.errors?.[0]?.code === "form_username_invalid_character"
      ) {
        Alert.alert(
          "Invalid Username",
          "Username can only contain letters, numbers, and underscores.",
        );
      } else {
        const errorMessage =
          error.errors?.[0]?.message ||
          error.message ||
          "Failed to set username";
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 bg-gray-900">
      <Text className="text-3xl font-bold mt-10 mb-2 text-gray-50">
        Choose Your Username
      </Text>
      <Text className="text-base text-gray-400 mb-10">
        This will be your unique identifier in the app
      </Text>

      <View className="mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Username
        </Text>
        <TextInput
          className="border border-gray-700 bg-gray-800 rounded-lg p-4 text-base text-gray-50"
          placeholder="johndoe"
          placeholderTextColor="#9CA3AF"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          maxLength={20}
        />
        <Text className="text-xs text-gray-400 mt-1.5">
          Must be 3-20 characters. Letters, numbers, and underscores only.
        </Text>
      </View>

      <TouchableOpacity
        className={`bg-violet-600 p-4 rounded-lg items-center ${loading || !username.trim() ? "opacity-60" : "active:bg-violet-700"}`}
        onPress={handleSubmit}
        disabled={loading || !username.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#F9FAFB" />
        ) : (
          <Text className="text-gray-50 text-base font-semibold">Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
