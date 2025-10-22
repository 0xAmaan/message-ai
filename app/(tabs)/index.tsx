import { SignOutButton } from "@/components/SignOutButton";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatListItem } from "../../components/ChatListItem";
import { COLORS } from "../../lib/constants";

export default function ChatsScreen() {
  const { user } = useUser();
  const router = useRouter();

  // Query conversations from Convex
  const conversations = useQuery(
    api.conversations.getUserConversations,
    user?.id ? { clerkId: user.id } : "skip",
  );

  const userIdentifier =
    user?.username ||
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  // Loading state
  if (conversations === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{userIdentifier}</Text>
          </View>
          <SignOutButton />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{userIdentifier}</Text>
          </View>
          <SignOutButton />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
          <Text style={styles.emptyStateTitle}>No chats yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start a conversation by tapping the button below
          </Text>

          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push("/new-chat")}
          >
            <Text style={styles.newChatButtonText}>+ New Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // List of conversations
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{userIdentifier}</Text>
        </View>
        <SignOutButton />
      </View>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ChatListItem conversation={item} currentUserId={user?.id || ""} />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating action button for new chat */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/new-chat")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.gray,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 4,
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
    marginBottom: 32,
  },
  newChatButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newChatButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "300",
  },
});
