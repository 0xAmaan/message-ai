import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileSetupScreen = () => {
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
      if (!isLoaded || !user) {
        console.log("Waiting for user to load...");
        Alert.alert("Please wait", "Loading your session...");
        return;
      }

      // Get user data (session should be active now)
      const phoneNumber = user.primaryPhoneNumber?.phoneNumber || "";
      const clerkId = user.id;

      if (!clerkId) {
        console.error("Missing user ID:", { clerkId, user });
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
        hasProfileImage: !!profileImage,
      });

      // Save user to Convex - this creates/updates the user record
      await upsertUser({
        clerkId,
        phoneNumber: phoneNumber || "", // Phone might be empty if only username was used
        name: name.trim(),
        profilePicUrl: profileImage || undefined,
      });

      console.log("Profile saved successfully to Convex!");

      // Navigate to tabs - the main chat screen
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 bg-background-base items-center">
      <Text className="text-3xl font-bold mt-10 mb-2 text-gray-50">
        Complete Your Profile
      </Text>
      <Text className="text-base text-gray-400 mb-10">
        Help others recognize you
      </Text>

      <TouchableOpacity onPress={pickImage} className="mb-10">
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            className="w-30 h-30 rounded-full"
          />
        ) : (
          <View className="w-30 h-30 rounded-full bg-gray-700 justify-center items-center border-2 border-dashed border-gray-500">
            <Text className="text-4xl mb-1">📷</Text>
            <Text className="text-sm text-gray-400">Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View className="w-full mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Your Name
        </Text>
        <TextInput
          className="border border-gray-700 bg-gray-800 rounded-lg p-4 text-base text-gray-50"
          placeholder="Enter your name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={50}
        />
        <Text className="text-xs text-gray-400 mt-1.5">
          This name will be visible to your contacts
        </Text>
      </View>

      <TouchableOpacity
        className={`bg-violet-600 p-4 rounded-lg items-center w-full ${loading || !name.trim() ? "opacity-60" : "active:bg-violet-700"}`}
        onPress={handleSubmit}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#F9FAFB" />
        ) : (
          <Text className="text-gray-50 text-base font-semibold">Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        className="mt-5"
      >
        <Text className="text-gray-400 text-sm">Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileSetupScreen;
