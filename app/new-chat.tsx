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

  const handleSelectUser = async (selectedUserId: string) => {
    if (!user?.id || selectedUserId === user.id) {
      Alert.alert("Error", "Cannot start a chat with yourself");
      return;
    }

    try {
      // Create or get existing conversation
      const conversationId = await createOrGetConversation({
        participants: [user.id, selectedUserId],
        type: "direct",
      });

      // Navigate to the chat
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
          className="bg-gray-700 rounded-lg px-4 py-3 text-base text-gray-50"
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
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : displayUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-bold text-gray-50 mb-2">
            {isSearching ? "No user found" : "No users available"}
          </Text>
          <Text className="text-sm text-gray-400 text-center">
            {isSearching
              ? "Try searching with a different phone number"
              : "Users will appear here once they sign up"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayUsers}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-800 border-b border-gray-700 active:bg-gray-700"
              onPress={() => handleSelectUser(item.clerkId)}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-violet-600 justify-center items-center mr-3 relative">
                <Text className="text-gray-50 text-xl font-semibold">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
                {item.isOnline && (
                  <View className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-800" />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-50 mb-1">
                  {item.name}
                </Text>
                <Text className="text-sm text-gray-400">
                  {item.phoneNumber}
                </Text>
              </View>

              {item.isOnline && (
                <View className="bg-emerald-500 px-2 py-1 rounded-xl">
                  <Text className="text-gray-50 text-xs font-semibold">
                    Online
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
}
