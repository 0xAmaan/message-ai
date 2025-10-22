import { SignOutButton } from "@/components/SignOutButton";
import { useUser } from "@clerk/clerk-expo";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../lib/constants";

export default function ChatsScreen() {
  const { user } = useUser();

  // Query conversations from Convex
  // For now, we'll just show a placeholder since we haven't created the conversations schema yet
  // const conversations = useQuery(api.conversations.list);

  const userIdentifier =
    user?.username ||
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  return (
    <View style={styles.container}>
      {/* Header with user info and sign out */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{userIdentifier}</Text>
        </View>
        <SignOutButton />
      </View>

      {/* Empty state - no conversations yet */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>💬</Text>
        <Text style={styles.emptyStateTitle}>No chats yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Start a conversation by tapping the button below
        </Text>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            // TODO: Navigate to new chat screen (Phase 7)
            console.log("New chat button pressed");
          }}
        >
          <Text style={styles.newChatButtonText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Future: List of conversations */}
      {/* <FlatList
        data={conversations}
        renderItem={({ item }) => <ChatListItem conversation={item} />}
        keyExtractor={(item) => item._id}
      /> */}
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
});
