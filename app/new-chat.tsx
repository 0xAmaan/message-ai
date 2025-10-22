import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
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
import { COLORS } from "../lib/constants";

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
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by phone number (+1234567890)"
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={handleSearch}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* User List */}
      {displayUsers === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : displayUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>👥</Text>
          <Text style={styles.emptyStateTitle}>
            {isSearching ? "No user found" : "No users available"}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
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
              style={styles.userItem}
              onPress={() => handleSelectUser(item.clerkId)}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userPhone}>{item.phoneNumber}</Text>
              </View>

              {item.isOnline && (
                <View style={styles.onlineBadge}>
                  <Text style={styles.onlineBadgeText}>Online</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInput: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  userAvatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "600",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ade80",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  onlineBadge: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
