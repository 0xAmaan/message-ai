import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-expo";
import { useAction, useMutation, useQuery } from "convex/react";
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
import {
  MessageInput,
  MessageInputRef,
} from "../../components/MessageInput";
import {
  SmartReplyChips,
  SmartReplyChipsLoading,
} from "../../components/SmartReplyChips";

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
  const messageInputRef = useRef<MessageInputRef>(null);
  const navigation = useNavigation();
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(true);

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
  const clearSmartReplies = useMutation(api.smartReplies.clearSmartReplies);

  // Actions
  const generateSmartReplies = useAction(api.smartReplies.generateSmartReplies);

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

  // Generate smart replies when screen opens with unread messages
  useEffect(() => {
    const generateRepliesOnOpen = async () => {
      if (!user?.id || !conversationId || !messages || messages.length === 0) {
        return;
      }

      // Check if the last message is from another user
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== user.id && !lastMessage.readBy.includes(user.id)) {
        setIsGeneratingReplies(true);
        try {
          await generateSmartReplies({
            conversationId,
            currentUserId: user.id,
          });
        } catch (error) {
          console.error("Failed to generate smart replies:", error);
        } finally {
          setIsGeneratingReplies(false);
        }
      }
    };

    generateRepliesOnOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (allMessages && allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages]);

  // Debounced smart reply generation when new messages arrive
  useEffect(() => {
    if (!user?.id || !messages || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];

    // Only generate if last message is from another user
    if (lastMessage.senderId === user.id) {
      return;
    }

    // Debounce: wait 2 seconds before generating
    const timer = setTimeout(async () => {
      setIsGeneratingReplies(true);
      try {
        await generateSmartReplies({
          conversationId,
          currentUserId: user.id,
        });
      } catch (error) {
        console.error("Failed to generate smart replies:", error);
      } finally {
        setIsGeneratingReplies(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages, user?.id, conversationId, generateSmartReplies]);

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

      // Clear smart replies when user sends a message
      setShowSmartReplies(false);

      try {
        await sendMessage({
          conversationId,
          senderId: user.id,
          content: content.trim(),
        });

        // Clear cached smart replies
        await clearSmartReplies({ conversationId });

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
    [user?.id, conversationId, sendMessage, clearSmartReplies],
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

        // Clear smart replies when user sends an image
        setShowSmartReplies(false);
        await clearSmartReplies({ conversationId });

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
    [user?.id, conversationId, sendMessage, generateUploadUrl, clearSmartReplies],
  );

  const handleSelectReply = useCallback((text: string) => {
    messageInputRef.current?.fillMessage(text);
  }, []);

  const handleDismissReplies = useCallback(() => {
    setShowSmartReplies(false);
  }, []);

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
              currentUserId={user?.id}
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

        {/* Smart Reply Chips */}
        {showSmartReplies && user?.id && (
          <>
            {isGeneratingReplies ? (
              <SmartReplyChipsLoading />
            ) : (
              <SmartReplyChips
                conversationId={conversationId}
                currentUserId={user.id}
                onSelectReply={handleSelectReply}
                onDismiss={handleDismissReplies}
              />
            )}
          </>
        )}

        {/* Message Input */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#1F2937" }}>
          <MessageInput
            ref={messageInputRef}
            onSend={handleSendMessage}
            onSendImage={handleSendImage}
            onTypingChange={handleTypingChange}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
