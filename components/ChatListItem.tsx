import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface ChatListItemProps {
  conversation: {
    _id: Id<"conversations">;
    participants: string[];
    type: "direct" | "group";
    lastMessageAt: number;
    createdAt: number;
  };
  currentUserId: string;
}

export function ChatListItem({
  conversation,
  currentUserId,
}: ChatListItemProps) {
  const router = useRouter();

  // Get the other participant(s) details
  const participants = useQuery(api.conversations.getConversationParticipants, {
    conversationId: conversation._id,
  });

  // Get the last message
  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversation._id,
    limit: 1,
  });

  const lastMessage =
    messages && messages.length > 0 ? messages[messages.length - 1] : null;

  // For direct chats, find the other user
  const otherUser =
    conversation.type === "direct"
      ? participants?.find((p) => p.clerkId !== currentUserId)
      : null;

  // Display name
  const displayName =
    conversation.type === "direct"
      ? otherUser?.name || "Unknown User"
      : `Group (${conversation.participants.length})`;

  // Last message preview
  const lastMessageText = lastMessage
    ? lastMessage.imageId
      ? "📷 Image"
      : lastMessage.content
    : "No messages yet";

  // Time formatting
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // Within a week
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handlePress = () => {
    router.push(`/chat/${conversation._id}` as any);
  };

  if (!participants) {
    return (
      <View className="flex-row p-4 bg-gray-800 border-b border-gray-700">
        <View className="w-12 h-12 rounded-full bg-violet-600 justify-center items-center mr-3">
          <Text className="text-gray-50 text-xl font-semibold">...</Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-gray-50 text-base font-semibold">
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      className="flex-row p-4 bg-gray-800 border-b border-gray-700 active:bg-gray-700"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        className={`w-12 h-12 rounded-full bg-violet-600 justify-center items-center mr-3 relative ${otherUser?.isOnline ? "border-2 border-violet-500" : ""}`}
      >
        <Text className="text-gray-50 text-xl font-semibold">
          {displayName.charAt(0).toUpperCase()}
        </Text>
        {otherUser?.isOnline && (
          <View className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-800" />
        )}
      </View>

      {/* Chat info */}
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className="text-gray-50 text-base font-semibold flex-1"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text className="text-gray-400 text-xs ml-2">
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <Text className="text-gray-400 text-sm" numberOfLines={2}>
          {lastMessage?.senderId === currentUserId && "You: "}
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
