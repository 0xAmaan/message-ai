import { Id } from "@/convex/_generated/dataModel";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

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
  currentUserId?: string; // For translation feature
  senderName?: string; // Sender's name for group chats
  senderProfilePicUrl?: string; // Sender's profile picture for group chats
  isGroupChat?: boolean; // Whether this is a group chat
}

export const MessageBubble = ({
  message,
  isOwnMessage,
  isPending,
  currentUserId,
  senderName,
  senderProfilePicUrl,
  isGroupChat,
}: MessageBubbleProps) => {
  const [showOriginal, setShowOriginal] = useState(false); // Toggle to show original when translation is displayed

  // Get image URL if message has an image
  const imageUrl = useQuery(
    api.messages.getImageUrl,
    message.imageId ? { imageId: message.imageId } : "skip",
  );

  // Get current user's data to fetch their preferred language
  const currentUser = useQuery(
    api.users.getCurrentUser,
    currentUserId ? { clerkId: currentUserId } : "skip",
  );

  const preferredLanguage = currentUser?.preferredLanguage || "English";

  // Get cached translation if it exists for user's preferred language
  const cachedTranslation = useQuery(
    api.translations.getTranslation,
    typeof message._id === "string" || !currentUserId
      ? "skip"
      : {
          messageId: message._id as Id<"messages">,
          targetLanguage: preferredLanguage,
        },
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

  // Get flag emoji for language code
  const getFlagEmoji = (languageCode: string): string => {
    const languageToFlag: Record<string, string> = {
      en: "🇺🇸",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      pt: "🇵🇹",
      ru: "🇷🇺",
      zh: "🇨🇳",
      ja: "🇯🇵",
      ko: "🇰🇷",
      ar: "🇸🇦",
      hi: "🇮🇳",
    };

    const code = languageCode.toLowerCase().substring(0, 2);
    return languageToFlag[code] || "🌐";
  };

  // Determine if we have a translation available (batch translation runs in background)
  const hasTranslation = !!cachedTranslation;

  // Capitalize sender name for group chats
  const capitalizedSenderName = senderName
    ? senderName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    : "Unknown";

  return (
    <View
      style={[
        styles.messageRow,
        isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
      ]}
    >
      {/* Profile picture for group chat messages from others */}
      {isGroupChat && !isOwnMessage && (
        <View style={styles.senderAvatarContainer}>
          {senderProfilePicUrl ? (
            <Image
              source={{ uri: senderProfilePicUrl }}
              style={styles.senderAvatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.senderAvatar}>
              <Text style={styles.senderAvatarText}>
                {capitalizedSenderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.messageWrapper}>
        {/* Sender name above bubble for group chats */}
        {isGroupChat && !isOwnMessage && senderName && (
          <Text style={styles.senderNameAboveBubble}>
            {capitalizedSenderName}
          </Text>
        )}

        <View
          style={[
            message.imageId ? styles.bubbleNoImage : styles.bubble,
            isOwnMessage
              ? {
                  backgroundColor: "#3D88F7",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: "#1A1A1A",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 16,
                },
          ]}
        >
          {/* Image if present */}
          {message.imageId && (
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.messageImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="small" color="#3D88F7" />
                </View>
              )}
            </View>
          )}

          {/* Text content if present */}
          {message.content && (
            <>
              {/* Show translation label if translation is displayed */}
              {hasTranslation && !showOriginal && (
                <TouchableOpacity
                  onPress={() => setShowOriginal(true)}
                  style={[
                    styles.translationLabel,
                    message.imageId && { marginHorizontal: 12, marginTop: 8 },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.translationLabelText}>
                    {getFlagEmoji(
                      cachedTranslation!.detectedSourceLanguage ||
                        cachedTranslation!.detectedLanguage,
                    )}{" "}
                    Translated from{" "}
                    {cachedTranslation!.detectedSourceLanguage ||
                      cachedTranslation!.detectedLanguage}{" "}
                    🌐
                  </Text>
                </TouchableOpacity>
              )}

              <Text
                style={[
                  styles.messageText,
                  message.imageId && styles.messageTextWithImage,
                ]}
              >
                {hasTranslation && !showOriginal
                  ? cachedTranslation!.translatedText
                  : message.content}
              </Text>
            </>
          )}

          {/* Timestamp and read receipts */}
          <View
            style={[
              styles.timestampContainer,
              message.imageId && styles.timestampWithImage,
            ]}
          >
            <Text
              style={[
                styles.timestamp,
                { color: isOwnMessage ? "#E5E7EB" : "#9CA3AF" },
              ]}
            >
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <Text style={styles.readReceipt}>
                {isPending ? "⏱" : readByOthers > 0 ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </View>

        {/* Show original message and cultural context when user taps "Translated from..." */}
        {showOriginal && hasTranslation && (() => {
            const detectedLang = cachedTranslation!.detectedSourceLanguage;
            const culturalHints = cachedTranslation!.culturalHints || [];
            const slangExplanations = cachedTranslation!.slangExplanations || [];

            return (
              <View style={styles.originalMessageContainer}>
                {/* Header with close button */}
                <View style={styles.originalMessageHeader}>
                  <Text style={styles.originalMessageHeaderText}>
                    {getFlagEmoji(detectedLang)} Original Message
                  </Text>
                  <TouchableOpacity onPress={() => setShowOriginal(false)}>
                    <Text style={styles.hideButtonText}>
                      Hide
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Original message */}
                <View style={styles.originalMessageContent}>
                  <Text style={styles.originalMessageText}>
                    {message.content}
                  </Text>
                </View>

                {/* Cultural hints */}
                {culturalHints.length > 0 && (
                  <View style={styles.culturalHintsContainer}>
                    <Text style={styles.culturalHintsTitle}>
                      ℹ️ Cultural Context:
                    </Text>
                    {culturalHints.map((hint, index) => (
                      <Text
                        key={index}
                        style={styles.culturalHintText}
                      >
                        • {hint}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Slang explanations */}
                {slangExplanations.length > 0 && (
                  <View style={styles.slangContainer}>
                    <Text style={styles.slangTitle}>
                      📚 Slang & Idioms:
                    </Text>
                    {slangExplanations.map((item, index) => (
                      <Text
                        key={index}
                        style={styles.slangText}
                      >
                        • <Text style={styles.slangTerm}>{item.term}</Text> -{" "}
                        {item.explanation}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  senderAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  senderAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3D88F7",
    justifyContent: "center",
    alignItems: "center",
  },
  senderAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  messageWrapper: {
    maxWidth: "75%",
  },
  senderNameAboveBubble: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3D88F7",
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleNoImage: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  imageContainer: {
    overflow: "hidden",
    borderRadius: 12,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageLoading: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3D88F7",
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  senderNameWithImage: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    color: "#F9FAFB",
  },
  messageTextWithImage: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  timestampWithImage: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  timestamp: {
    fontSize: 13,
  },
  readReceipt: {
    fontSize: 14,
    marginLeft: 4,
    paddingRight: 5,
    color: "#1E40AF",
    letterSpacing: -6,
  },
  translationLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  translationLabelText: {
    fontSize: 11,
    color: "#93C5FD",
    fontWeight: "500",
  },
  originalMessageContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(61, 136, 247, 0.15)",
  },
  originalMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  originalMessageHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#93C5FD",
  },
  hideButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#60A5FA",
  },
  originalMessageContent: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  originalMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#E5E7EB",
  },
  culturalHintsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 136, 247, 0.3)",
  },
  culturalHintsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: "#93C5FD",
  },
  culturalHintText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
    color: "#C7D2FE",
  },
  slangContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 136, 247, 0.3)",
  },
  slangTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: "#FCD34D",
  },
  slangText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
    color: "#FEF3C7",
  },
  slangTerm: {
    fontWeight: "600",
  },
});
