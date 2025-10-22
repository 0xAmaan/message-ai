import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function NewChatScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  return (
    <View className="flex-1 bg-gray-900">
      {/* Search Input */}
      <View className="p-4 bg-gray-800 border-b border-gray-700">
        <TextInput
          className="bg-gray-700 rounded-lg px-4 py-3 text-base mb-2"
          style={{ color: "#F9FAFB" }}
          placeholder="Search by phone number (+1234567890)"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text className="text-xs" style={{ color: "#9CA3AF" }}>
          Tip: Select multiple users to create a group chat
        </Text>
      </View>

      {/* Create Chat Button */}
      {selectedUsers.length > 0 && (
        <View className="p-4 bg-gray-800 border-b border-gray-700">
          <TouchableOpacity
            className="bg-violet-600 py-3 rounded-lg active:bg-violet-700"
            onPress={handleCreateChat}
          >
            <Text
              className="text-center font-semibold text-base"
              style={{ color: "#F9FAFB" }}
            >
              {selectedUsers.length === 1
                ? "Start Chat"
                : `Create Group (${selectedUsers.length + 1} people)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* User List */}
      {displayUsers === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : displayUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-bold mb-2" style={{ color: "#F9FAFB" }}>
            {isSearching ? "No user found" : "No users available"}
          </Text>
          <Text className="text-sm text-center" style={{ color: "#9CA3AF" }}>
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
                className={`flex-row items-center p-4 border-b border-gray-700 active:bg-gray-700 ${
                  isSelected ? "bg-violet-900" : "bg-gray-800"
                }`}
                onPress={() => handleToggleUser(item.clerkId)}
                activeOpacity={0.7}
              >
                {/* Selection indicator */}
                <View
                  className={`w-6 h-6 rounded-full border-2 mr-3 justify-center items-center ${
                    isSelected
                      ? "bg-violet-600 border-violet-600"
                      : "border-gray-600"
                  }`}
                >
                  {isSelected && (
                    <Text className="text-xs font-bold" style={{ color: "#F9FAFB" }}>
                      ✓
                    </Text>
                  )}
                </View>

                <View className="w-12 h-12 rounded-full bg-violet-600 justify-center items-center mr-3 relative">
                  <Text className="text-xl font-semibold" style={{ color: "#F9FAFB" }}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                  {item.isOnline && (
                    <View className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-800" />
                  )}
                </View>

                <View className="flex-1">
                  <Text
                    className="text-base font-semibold mb-1"
                    style={{ color: "#F9FAFB" }}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-sm" style={{ color: "#9CA3AF" }}>
                    {item.phoneNumber}
                  </Text>
                </View>

                {item.isOnline && (
                  <View className="bg-emerald-500 px-2 py-1 rounded-xl">
                    <Text className="text-xs font-semibold" style={{ color: "#F9FAFB" }}>
                      Online
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
}
