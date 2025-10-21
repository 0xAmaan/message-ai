import { api } from "@/convex/_generated/api";
import { COLORS } from "@/lib/constants";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileSetupScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upsertUser = useMutation(api.users.upsertFromClerk);

  // Log user state for debugging
  useEffect(() => {
    console.log("Profile setup - User loaded:", isLoaded);
    console.log("Profile setup - User ID:", user?.id);
    console.log(
      "Profile setup - Phone:",
      user?.primaryPhoneNumber?.phoneNumber,
    );
  }, [isLoaded, user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Fixed: Use array instead of deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      setLoading(true);

      // Wait for user to be loaded after session activation
      if (!isLoaded) {
        console.log("Waiting for user to load...");
        Alert.alert("Please wait", "Loading your session...");
        return;
      }

      // Get phone number from user object (session should be active now)
      const phoneNumber = user?.primaryPhoneNumber?.phoneNumber || "";
      const clerkId = user?.id || "";

      if (!clerkId || !phoneNumber) {
        console.error("Missing user data:", { clerkId, phoneNumber, user });
        Alert.alert(
          "Error",
          "Session not properly established. Please try logging in again.",
        );
        router.replace("/(auth)/phone-input");
        return;
      }

      console.log("Saving profile to Convex...", {
        clerkId,
        phoneNumber,
        name: name.trim(),
      });

      // Save user to Convex - this creates the user record
      await upsertUser({
        clerkId,
        phoneNumber,
        name: name.trim(),
        profilePicUrl: profileImage || undefined,
      });

      console.log("Profile saved successfully!");

      // The auth layout will automatically redirect to home now that we're signed in
      // No need to manually navigate - let the auth guard handle it
      router.replace("/(home)");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Help others recognize you</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
            <Text style={styles.imagePlaceholderSubtext}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.gray}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={50}
        />
        <Text style={styles.hint}>
          This name will be visible to your contacts
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(home)")}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
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
  imageContainer: {
    marginBottom: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    fontSize: 40,
    marginBottom: 5,
  },
  imagePlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
  inputContainer: {
    width: "100%",
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
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: COLORS.gray,
    fontSize: 14,
  },
});
