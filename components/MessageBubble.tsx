import { Id } from "@/convex/_generated/dataModel";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../lib/constants";

interface MessageBubbleProps {
  message: {
    _id: Id<"messages">;
    conversationId: Id<"conversations">;
    senderId: string;
    content: string;
    imageId?: Id<"_storage">;
    createdAt: number;
    readBy: string[];
    deliveredTo: string[];
  };
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message.content}
        </Text>
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.timeText,
              isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
          {isOwnMessage && (
            <Text style={styles.checkmark}>
              {message.readBy.length > 1 ? "✓✓" : "✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    flexDirection: "row",
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownBubble: {
    backgroundColor: "#DCF8C6", // WhatsApp green
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: COLORS.black,
  },
  otherMessageText: {
    color: COLORS.black,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  ownTimeText: {
    color: "#667781",
  },
  otherTimeText: {
    color: COLORS.gray,
  },
  checkmark: {
    fontSize: 12,
    marginLeft: 4,
    color: "#4FC3F7",
  },
});
