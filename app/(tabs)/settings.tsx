import { SignOutButton } from "@/components/SignOutButton";
import { useUser } from "@clerk/clerk-expo";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const SettingsScreen = () => {
  const { user } = useUser();
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Get user's name, fallback to username or "User"
  const userName =
    user?.firstName ||
    user?.username ||
    "User";

  const phoneNumber = user?.primaryPhoneNumber?.phoneNumber;

  // Get current user data from Convex to fetch preferred language
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip",
  );

  // Mutations
  const updateLanguage = useMutation(api.users.updatePreferredLanguage);
  const generateUploadUrl = useMutation(api.users.generateProfilePicUploadUrl);
  const updateProfilePicture = useMutation(api.users.updateProfilePicture);

  // Action to batch translate recent messages
  const batchTranslate = useAction(api.translations.batchTranslateRecentMessages);

  const currentLanguage = currentUser?.preferredLanguage || DEFAULT_LANGUAGE;

  // Format phone number to look nicer (e.g., +1 (555) 123-4567)
  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters except the leading +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Check if it starts with +1 (US/Canada)
    if (cleaned.startsWith("+1") && cleaned.length === 12) {
      return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }

    // For other formats, just add spacing after country code
    if (cleaned.startsWith("+")) {
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const rest = cleaned.slice(cleaned.length - 10);
      return `${countryCode} ${rest}`;
    }

    return phone; // Return original if format doesn't match
  };

  const formattedPhoneNumber = phoneNumber ? formatPhoneNumber(phoneNumber) : null;

  // Capitalize the first letter of each word in the name
  const capitalizedName = userName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Handle profile picture upload
  const handlePickImage = async () => {
    if (!user?.id) {
      return;
    }

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant photo library access to change your profile picture.");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || !result.assets[0]) {
        return;
      }

      setIsUploadingImage(true);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the image
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("❌ Upload failed:", errorText);
        throw new Error("Failed to upload image");
      }

      const uploadResult = await uploadResponse.json();
      const { storageId } = uploadResult;

      // Update user profile with new image
      const imageUrl = await updateProfilePicture({
        clerkId: user.id,
        storageId,
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("❌ Failed to update profile picture:", error);
      Alert.alert("Error", `Failed to update profile picture: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle language selection
  const handleLanguageSelect = async (languageCode: string) => {
    if (!user?.id || languageCode === currentLanguage) return;

    setIsUpdatingLanguage(true);
    try {
      // Update user's preferred language
      await updateLanguage({
        clerkId: user.id,
        preferredLanguage: languageCode,
      });

      // Batch translate recent messages in background
      await batchTranslate({
        userId: user.id,
        targetLanguage: languageCode,
      });
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View style={styles.spacer} />
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.spacer} />
          </View>
        </SafeAreaView>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Profile Picture */}
        <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage}>
          <View style={styles.profilePictureContainer}>
            {currentUser?.profilePicUrl ? (
              <Image
                source={{ uri: currentUser.profilePicUrl }}
                style={styles.profilePicture}
                contentFit="cover"
              />
            ) : (
              <View style={styles.profilePicture}>
                <Text style={styles.profileInitial}>
                  {capitalizedName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#3D88F7" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* User Name */}
        <Text style={styles.userName}>{capitalizedName}</Text>

        {/* Phone Number */}
        {formattedPhoneNumber && (
          <Text style={styles.phoneNumber}>{formattedPhoneNumber}</Text>
        )}
      </View>

      {/* Language Preference Section */}
      <View style={styles.settingsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Translation Language</Text>
          {isUpdatingLanguage && (
            <ActivityIndicator size="small" color="#3D88F7" />
          )}
        </View>
        <Text style={styles.sectionDescription}>
          Messages in other languages will be automatically translated
        </Text>

        <ScrollView
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_LANGUAGES.map((language) => {
            const isSelected = language.code === currentLanguage;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  isSelected && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                disabled={isUpdatingLanguage}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    isSelected && styles.languageNameSelected,
                  ]}
                >
                  {language.name}
                </Text>
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Spacer to push Sign Out button near bottom */}
      <View style={{ flex: 1 }} />

      {/* Sign Out Button */}
      <View style={{ marginBottom: 75 }}>
        <SignOutButton />
      </View>
      <SafeAreaView edges={["bottom"]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor: "#1A1A1A",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  spacer: {
    width: 48,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    position: "relative",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3D88F7",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: 400,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  languageList: {
    maxHeight: 280,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginBottom: 8,
  },
  languageItemSelected: {
    backgroundColor: "rgba(61, 136, 247, 0.15)",
    borderWidth: 1,
    borderColor: "#3D88F7",
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: "#F9FAFB",
    flex: 1,
  },
  languageNameSelected: {
    fontWeight: "600",
    color: "#3D88F7",
  },
  checkmark: {
    fontSize: 20,
    color: "#3D88F7",
    fontWeight: "bold",
  },
});

export default SettingsScreen;
