import { Id } from "@/convex/_generated/dataModel";
import { Text, View } from "react-native";

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
      className={`mb-2 flex-row ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[75%] px-3 py-2 rounded-lg ${
          isOwnMessage
            ? "bg-violet-600 rounded-br-sm"
            : "bg-gray-700 rounded-bl-sm"
        }`}
      >
        <Text className="text-gray-50 text-base leading-5 mb-1">
          {message.content}
        </Text>
        <View className="flex-row items-center justify-end mt-0.5">
          <Text
            className={`text-[11px] ${isOwnMessage ? "text-gray-200" : "text-gray-400"}`}
          >
            {formatTime(message.createdAt)}
          </Text>
          {isOwnMessage && (
            <Text className="text-xs ml-1 text-blue-400">
              {message.readBy.length > 1 ? "✓✓" : "✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
