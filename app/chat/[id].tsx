import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

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

  // Update navigation title with user name
  useEffect(() => {
    if (displayName) {
      navigation.setOptions({
        title: displayName,
      });
    }
  }, [displayName, navigation]);

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
      <SafeAreaView className="flex-1 bg-gray-900" edges={["bottom"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 bg-gray-900"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
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
          contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          style={{ flex: 1, backgroundColor: "#111827" }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-400 text-sm">No messages yet</Text>
              <Text className="text-gray-500 text-xs mt-2">
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <MessageInput onSend={handleSendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
