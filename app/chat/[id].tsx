import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";
import { COLORS } from "../../lib/constants";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);

  const conversationId = id as Id<"conversations">;

  // Queries
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messages = useQuery(api.messages.getMessages, {
    conversationId,
    limit: 50,
  });
  const participants = useQuery(api.conversations.getConversationParticipants, {
    conversationId,
  });

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markConversationAsRead);

  // Get the other user (for direct chats)
  const otherUser =
    conversation?.type === "direct"
      ? participants?.find((p) => p.clerkId !== user?.id)
      : null;

  const displayName = otherUser?.name || "Chat";

  // Mark messages as read when screen opens
  useEffect(() => {
    if (user?.id && conversationId) {
      markAsRead({ conversationId, userId: user.id });
    }
  }, [conversationId, user?.id, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || !content.trim()) return;

      try {
        await sendMessage({
          conversationId,
          senderId: user.id,
          content: content.trim(),
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [user?.id, conversationId, sendMessage],
  );

  if (!conversation || !messages || !participants) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            {otherUser?.isOnline && (
              <Text style={styles.headerStatus}>Online</Text>
            )}
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwnMessage={item.senderId === user?.id}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD", // WhatsApp-style background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
});
