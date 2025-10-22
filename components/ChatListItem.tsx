import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../lib/constants";

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
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>...</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, otherUser?.isOnline && styles.avatarOnline]}>
        <Text style={styles.avatarText}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
        {otherUser?.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Chat info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <Text style={styles.lastMessage} numberOfLines={2}>
          {lastMessage?.senderId === currentUserId && "You: "}
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  avatarOnline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
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
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
