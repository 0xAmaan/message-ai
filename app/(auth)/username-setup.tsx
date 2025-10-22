import { api } from "@/convex/_generated/api";
import { useSignUp } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../lib/constants";

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
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Username</Text>
      <Text style={styles.subtitle}>
        This will be your unique identifier in the app
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="johndoe"
          placeholderTextColor={COLORS.gray}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          maxLength={20}
        />
        <Text style={styles.hint}>
          Must be 3-20 characters. Letters, numbers, and underscores only.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !username.trim()}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 10,
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
