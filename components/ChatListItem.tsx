import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Circle, CheckCircle2 } from "lucide-react-native";

interface ChatListItemProps {
  conversation: {
    _id: Id<"conversations">;
    participants: string[];
    type: "direct" | "group";
    lastMessageAt: number;
    createdAt: number;
  };
  currentUserId: string;
  isEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const ChatListItem = ({
  conversation,
  currentUserId,
  isEditMode = false,
  isSelected = false,
  onToggleSelect,
}: ChatListItemProps) => {
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

  // Get current user's preferred language
  const currentUser = useQuery(
    api.users.getCurrentUser,
    currentUserId ? { clerkId: currentUserId } : "skip",
  );

  // Get translation for the last message if it exists
  const lastMessageTranslation = useQuery(
    api.translations.getTranslation,
    lastMessage && currentUser?.preferredLanguage
      ? {
          messageId: lastMessage._id,
          targetLanguage: currentUser.preferredLanguage,
        }
      : "skip",
  );

  // Check if conversation has unread messages
  const hasUnread = useQuery(api.messages.hasUnreadMessages, {
    conversationId: conversation._id,
    userId: currentUserId,
  });

  // For direct chats, find the other user
  const otherUser =
    conversation.type === "direct"
      ? participants?.find((p) => p.clerkId !== currentUserId)
      : null;

  // Display name with capitalization
  const capitalizeName = (name: string) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const displayName = (() => {
    if (conversation.type === "direct") {
      return otherUser?.name ? capitalizeName(otherUser.name) : "Unknown User";
    } else {
      // Group chat - show participant names
      const otherParticipants = participants?.filter((p) => p.clerkId !== currentUserId) || [];
      if (otherParticipants.length === 0) return "Group Chat";

      const capitalizedNames = otherParticipants.map((p) => capitalizeName(p.name || "Unknown"));

      if (capitalizedNames.length === 1) return capitalizedNames[0];
      if (capitalizedNames.length === 2) {
        return `${capitalizedNames[0]} & ${capitalizedNames[1]}`;
      }

      // For 3+ people, try to fit names
      const fullName = capitalizedNames.join(", ").replace(/, ([^,]*)$/, " & $1");

      // If name is too long (over 25 chars for list view), truncate
      if (fullName.length > 25) {
        return `${capitalizedNames[0]}, ${capitalizedNames[1]}...`;
      }

      return fullName;
    }
  })();

  // Last message preview - use translation if available
  const lastMessageText = lastMessage
    ? lastMessage.imageId
      ? "📷 Image"
      : lastMessageTranslation?.translatedText || lastMessage.content
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
    if (isEditMode && onToggleSelect) {
      onToggleSelect();
    } else {
      router.push(`/chat/${conversation._id}` as any);
    }
  };

  if (!participants) {
    return (
      <View className="flex-row p-4 bg-background-base border-b border-gray-700">
        <View
          className="w-12 h-12 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: "#3D88F7" }}
        >
          <Text className="text-xl font-semibold text-gray-50">...</Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-base font-semibold text-gray-50">
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      className={`flex-row p-4 border-b border-gray-700 active:bg-gray-900 ${
        isSelected ? "bg-gray-800" : "bg-background-base"
      }`}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Checkbox (edit mode only) */}
      {isEditMode && (
        <View className="justify-center items-center mr-3">
          {isSelected ? (
            <CheckCircle2 color="#3D88F7" size={24} fill="#3D88F7" />
          ) : (
            <Circle color="#6B7280" size={24} />
          )}
        </View>
      )}

      {/* Avatar */}
      <View style={{ position: "relative", marginRight: 12 }}>
        {otherUser?.profilePicUrl ? (
          <Image
            source={{ uri: otherUser.profilePicUrl }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-primary justify-center items-center">
            <Text className="text-xl font-semibold text-gray-50">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {otherUser?.isOnline && (
          <View className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background-base" />
        )}
      </View>

      {/* Chat info */}
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <Text
            className="text-lg font-semibold flex-1 text-gray-50"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-400">
              {formatTime(conversation.lastMessageAt)}
            </Text>
            {hasUnread && (
              <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
            )}
          </View>
        </View>

        <Text className="text-base text-gray-400" numberOfLines={2}>
          {lastMessage?.senderId === currentUserId && "You: "}
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
