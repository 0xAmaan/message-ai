import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Optimistic message type
interface OptimisticMessage {
  _id: string;
  conversationId: Id<"conversations">;
  senderId: string;
  content: string;
  imageId?: Id<"_storage">;
  createdAt: number;
  readBy: string[];
  deliveredTo: string[];
  isPending?: boolean;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);

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
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    user?.id
      ? {
          conversationId,
          currentUserId: user.id,
        }
      : "skip",
  );

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markConversationAsRead);
  const updateTypingStatus = useMutation(api.typing.updateTypingStatus);

  // Get the other user (for direct chats)
  const otherUser =
    conversation?.type === "direct"
      ? participants?.find((p) => p.clerkId !== user?.id)
      : null;

  const displayName = otherUser?.name || "Chat";

  // Merge real messages with optimistic messages
  const allMessages = [
    ...(messages || []),
    ...optimisticMessages,
  ].sort((a, b) => a.createdAt - b.createdAt);

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
    if (allMessages && allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages]);

  const handleTypingChange = useCallback(
    async (isTyping: boolean) => {
      if (!user?.id) return;

      try {
        await updateTypingStatus({
          conversationId,
          userId: user.id,
          isTyping,
        });
      } catch (error) {
        console.error("Failed to update typing status:", error);
      }
    },
    [user?.id, conversationId, updateTypingStatus],
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || !content.trim()) return;

      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: OptimisticMessage = {
        _id: tempId,
        conversationId,
        senderId: user.id,
        content: content.trim(),
        createdAt: Date.now(),
        readBy: [user.id],
        deliveredTo: [user.id],
        isPending: true,
      };

      // Add to optimistic messages
      setOptimisticMessages((prev) => [...prev, optimisticMsg]);

      try {
        await sendMessage({
          conversationId,
          senderId: user.id,
          content: content.trim(),
        });

        // Remove optimistic message after successful send
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg._id !== tempId),
        );
      } catch (error) {
        console.error("Failed to send message:", error);
        // Remove failed optimistic message
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg._id !== tempId),
        );
      }
    },
    [user?.id, conversationId, sendMessage],
  );

  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const handleSendImage = useCallback(
    async (imageUri: string) => {
      if (!user?.id) return;

      try {
        // Get upload URL from Convex mutation
        const uploadUrl = await generateUploadUrl();

        // Upload the image
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await uploadResponse.json();

        // Send message with image
        await sendMessage({
          conversationId,
          senderId: user.id,
          content: "",
          imageId: storageId,
        });
      } catch (error) {
        console.error("Failed to send image:", error);
        alert("Failed to send image. Please try again.");
      }
    },
    [user?.id, conversationId, sendMessage, generateUploadUrl],
  );

  if (!conversation || !messages || !participants) {
    return (
      <View className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.senderId === user?.id}
              isPending={(item as OptimisticMessage).isPending}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          className="flex-1"
          style={{ backgroundColor: "#111827" }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-sm" style={{ color: "#9CA3AF" }}>
                No messages yet
              </Text>
              <Text className="text-xs mt-2" style={{ color: "#6B7280" }}>
                Send a message to start the conversation
              </Text>
            </View>
          }
          ListFooterComponent={
            typingUsers && typingUsers.length > 0 ? (
              <View className="px-4 py-2">
                <Text className="text-sm italic" style={{ color: "#9CA3AF" }}>
                  {typingUsers[0].name} is typing...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Message Input */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#1F2937" }}>
          <MessageInput
            onSend={handleSendMessage}
            onSendImage={handleSendImage}
            onTypingChange={handleTypingChange}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
