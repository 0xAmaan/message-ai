import { Id } from "@/convex/_generated/dataModel";
import { Text, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface MessageBubbleProps {
  message: {
    _id: Id<"messages"> | string;
    conversationId: Id<"conversations">;
    senderId: string;
    content: string;
    imageId?: Id<"_storage">;
    createdAt: number;
    readBy: string[];
    deliveredTo: string[];
  };
  isOwnMessage: boolean;
  isPending?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  isPending,
}: MessageBubbleProps) {
  // Get image URL if message has an image
  const imageUrl = useQuery(
    api.messages.getImageUrl,
    message.imageId ? { imageId: message.imageId } : "skip",
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if message has been read by someone OTHER than the sender
  const readByOthers = message.readBy.filter(
    (id) => id !== message.senderId,
  ).length;

  return (
    <View
      className={`mb-2 flex-row ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[75%] ${message.imageId ? "px-0 py-0" : "px-3 py-2"} rounded-lg ${
          isOwnMessage
            ? "bg-violet-600 rounded-br-sm"
            : "bg-gray-700 rounded-bl-sm"
        }`}
      >
        {/* Image if present */}
        {message.imageId && (
          <View className="overflow-hidden rounded-lg">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 200, height: 200 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 200,
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            )}
          </View>
        )}

        {/* Text content if present */}
        {message.content && (
          <Text
            className={`text-base leading-5 mb-1 ${message.imageId ? "px-3 py-2" : ""}`}
            style={{ color: "#F9FAFB" }}
          >
            {message.content}
          </Text>
        )}

        {/* Timestamp and read receipts */}
        <View
          className={`flex-row items-center justify-end mt-0.5 ${message.imageId ? "px-3 pb-2" : ""}`}
        >
          <Text
            className="text-[11px]"
            style={{ color: isOwnMessage ? "#E5E7EB" : "#9CA3AF" }}
          >
            {formatTime(message.createdAt)}
          </Text>
          {isOwnMessage && (
            <Text className="text-xs ml-1" style={{ color: "#60A5FA" }}>
              {isPending ? "⏱" : readByOthers > 0 ? "✓✓" : "✓"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
