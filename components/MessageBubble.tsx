import { Id } from "@/convex/_generated/dataModel";
import {
  Text,
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TranslateButton } from "./TranslateButton";
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
  const [isTranslating, setIsTranslating] = useState(false);
  const [localTranslation, setLocalTranslation] = useState<{
    translation: string;
    detectedLanguage: string;
    culturalHints: string[];
    slangExplanations: { term: string; explanation: string }[];
  } | null>(null);

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

  // Translation action
  const translateMessage = useAction(api.translations.translateMessage);

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

  const handleTranslate = async () => {
    // Don't translate if missing required data or if it's an optimistic message
    const isOptimisticMessage =
      typeof message._id === "string" && message._id.startsWith("temp-");

    if (isOptimisticMessage || !currentUserId || !message.content.trim()) {
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateMessage({
        messageId: message._id as Id<"messages">,
        targetLanguage: preferredLanguage,
        userId: currentUserId,
      });

      if (result) {
        // Store the translation locally
        setLocalTranslation(result);
      }
    } catch (error) {
      console.error("Translation error:", error);
      Alert.alert(
        "Translation Failed",
        error instanceof Error ? error.message : "Failed to translate message",
      );
    } finally {
      setIsTranslating(false);
    }
  };

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

  // Determine if we have a translation available
  const isOptimisticMessage =
    typeof message._id === "string" && message._id.startsWith("temp-");

  const translation = cachedTranslation || localTranslation;
  const hasTranslation = !!translation;

  // Show translate button only if:
  // 1. Not user's own message
  // 2. Has text content
  // 3. Not an optimistic message
  // 4. No translation available yet
  const showTranslateButton =
    !isOwnMessage &&
    currentUserId &&
    message.content.trim().length > 0 &&
    !isOptimisticMessage &&
    !hasTranslation;

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
              style={styles.senderAvatar}
              contentFit="cover"
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
        {/* Sender name for group chat messages from others */}
        {isGroupChat && !isOwnMessage && (
          <Text style={styles.senderName}>{capitalizedSenderName}</Text>
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
                  style={{ width: 200, height: 200 }}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="small" color="#3D88F7" />
                </View>
              )}
            </View>
          )}

          {/* Sender name for group chats */}
          {senderName && !isOwnMessage && (
            <Text
              style={[
                styles.senderName,
                message.imageId && styles.senderNameWithImage,
              ]}
            >
              {capitalizedSenderName}
            </Text>
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
                      translation!.detectedSourceLanguage ||
                        translation!.detectedLanguage,
                    )}{" "}
                    Translated from{" "}
                    {translation!.detectedSourceLanguage ||
                      translation!.detectedLanguage}{" "}
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
                  ? translation!.translatedText || translation!.translation
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
            const detectedLang = translation!.detectedSourceLanguage || translation!.detectedLanguage;
            const culturalHints = translation!.culturalHints || [];
            const slangExplanations = translation!.slangExplanations || [];

            return (
              <View
                className="mt-2 px-4 py-3 rounded-lg"
                style={{ backgroundColor: "rgba(61, 136, 247, 0.15)" }}
              >
                {/* Header with close button */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-medium text-blue-300">
                    {getFlagEmoji(detectedLang)} Original Message
                  </Text>
                  <TouchableOpacity onPress={() => setShowOriginal(false)}>
                    <Text className="text-sm font-semibold text-blue-400">
                      Hide
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Original message */}
                <View
                  className="mb-3 p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <Text className="text-base leading-6 text-gray-200">
                    {message.content}
                  </Text>
                </View>

                {/* Cultural hints */}
                {culturalHints.length > 0 && (
                  <View
                    className="mt-3 pt-3"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(61, 136, 247, 0.3)",
                    }}
                  >
                    <Text className="text-xs font-semibold mb-2 text-blue-300">
                      ℹ️ Cultural Context:
                    </Text>
                    {culturalHints.map((hint, index) => (
                      <Text
                        key={index}
                        className="text-xs leading-5 mb-1.5 pl-1 text-indigo-100"
                      >
                        • {hint}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Slang explanations */}
                {slangExplanations.length > 0 && (
                  <View
                    className="mt-3 pt-3"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(61, 136, 247, 0.3)",
                    }}
                  >
                    <Text className="text-xs font-semibold mb-2 text-yellow-400">
                      📚 Slang & Idioms:
                    </Text>
                    {slangExplanations.map((item, index) => (
                      <Text
                        key={index}
                        className="text-xs leading-5 mb-1.5 pl-1 text-yellow-100"
                      >
                        • <Text className="font-semibold">{item.term}</Text> -{" "}
                        {item.explanation}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}

        {/* Translate button */}
        {showTranslateButton && (
          <TranslateButton
            isTranslating={isTranslating}
            isTranslated={showTranslation}
            onPress={handleTranslate}
            isOwnMessage={isOwnMessage}
          />
        )}
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
    borderRadius: 8,
  },
  imageLoading: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
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
});
