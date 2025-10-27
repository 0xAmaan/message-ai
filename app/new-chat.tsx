import Header from "@/components/Header";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Check } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const NewChatScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const navigation = useNavigation();

  // Query to find user by phone number
  const searchedUser = useQuery(
    api.users.findByPhone,
    searchQuery.trim() ? { phoneNumber: searchQuery.trim() } : "skip",
  );

  // Get all users (fallback if not searching)
  const allUsers = useQuery(api.users.listUsers);

  // Mutation to create or get conversation
  const createOrGetConversation = useMutation(
    api.conversations.createOrGetConversation,
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateChat = async () => {
    if (!user?.id) return;

    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Please select at least one user");
      return;
    }

    try {
      const isGroup = selectedUsers.length > 1;
      const conversationId = await createOrGetConversation({
        participants: [user.id, ...selectedUsers],
        type: isGroup ? "group" : "direct",
      });

      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    }
  };

  const displayUsers = isSearching
    ? searchedUser
      ? [searchedUser]
      : []
    : allUsers?.filter((u) => u.clerkId !== user?.id) || [];

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      // Remove country code
      const withoutCountry = cleaned.slice(1);
      return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Return original if not a standard US format
    return phoneNumber;
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View className="flex-1 bg-background-base">
      <Header navigation={navigation} title="Start Chat" />

      {/* Search Input */}
      <View className="p-4 bg-background border-b border-gray-700">
        <TextInput
          className="bg-background-base rounded-lg px-4 py-3 text-base text-gray-50"
          placeholder="Search by phone number (+1234567890)"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* User List */}
      {displayUsers === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3D88F7" />
        </View>
      ) : displayUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-bold mb-2 text-gray-50">
            {isSearching ? "No user found" : "No users available"}
          </Text>
          <Text className="text-sm text-center text-gray-400">
            {isSearching
              ? "Try searching with a different phone number"
              : "Users will appear here once they sign up"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayUsers}
          renderItem={({ item }) => {
            const isSelected = selectedUsers.includes(item.clerkId);
            return (
              <TouchableOpacity
                className="flex-row items-center p-4 border-b border-gray-700 bg-background-base active:bg-gray-900"
                onPress={() => handleToggleUser(item.clerkId)}
                activeOpacity={0.7}
              >
                {/* Profile Picture */}
                <View style={styles.profilePictureContainer}>
                  {item.profilePicUrl ? (
                    <Image
                      source={{ uri: item.profilePicUrl }}
                      style={styles.profilePicture}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.profilePicture}>
                      <Text style={styles.profileInitial}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {/* Online Indicator */}
                  {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                {/* User Info */}
                <View className="flex-1">
                  <Text className="text-lg font-semibold mb-1 text-gray-50">
                    {capitalizeFirstLetter(item.name)}
                  </Text>
                  <Text className="text-base text-gray-400">
                    {formatPhoneNumber(item.phoneNumber)}
                  </Text>
                </View>

                {/* Select Button with Check Icon */}
                <View style={[styles.selectButton, isSelected && styles.selectButtonActive]}>
                  {isSelected && <Check color="#F9FAFB" size={18} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="flex-1 bg-background-base"
        />
      )}

      {/* Fixed Start Chat Button at Bottom */}
      {selectedUsers.length > 0 && (
        <SafeAreaView edges={["bottom"]} style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.startChatButton}
            onPress={handleCreateChat}
            activeOpacity={0.8}
          >
            <Text style={styles.startChatButtonText}>
              {selectedUsers.length === 1
                ? "Start Chat"
                : `Create Group (${selectedUsers.length + 1} people)`}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Bottom Button Container
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  // Start Chat Button
  startChatButton: {
    backgroundColor: "#3D88F7",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  startChatButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  // Profile Picture Container
  profilePictureContainer: {
    width: 40,
    height: 40,
    marginRight: 16,
    position: "relative",
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3D88F7",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#1F2937",
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#6B7280",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  selectButtonActive: {
    backgroundColor: "#3D88F7",
    borderColor: "#3D88F7",
  },
});

export default NewChatScreen;
