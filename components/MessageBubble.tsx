import { Id } from "@/convex/_generated/dataModel";
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    detectedSourceLanguage?: string; // Language detected after batch translation
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

  // Toggle function with smooth animation
  const toggleOriginal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOriginal(!showOriginal);
  };

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
  // Skip only for optimistic messages (temp IDs start with "temp-")
  const isOptimisticMessage =
    typeof message._id === "string" && message._id.startsWith("temp-");
  const cachedTranslation = useQuery(
    api.translations.getTranslation,
    isOptimisticMessage || !currentUserId
      ? "skip"
      : {
          messageId: message._id as Id<"messages">,
          targetLanguage: preferredLanguage,
        },
  );

  // Get source language for determining if translation is needed
  const sourceLanguage = cachedTranslation?.detectedSourceLanguage || message.detectedSourceLanguage || "";

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

  // Determine if we have a translation available and if it's needed
  // Only show translation if the source language is different from the preferred language
  const needsTranslation =
    sourceLanguage && sourceLanguage !== preferredLanguage;
  const hasTranslation = !!cachedTranslation && needsTranslation;

  // Get cultural context from the translation (e.g., Japanese→English translation contains Japanese cultural context explained in English)
  const culturalHints = cachedTranslation?.culturalHints || [];
  const slangExplanations = cachedTranslation?.slangExplanations || [];

  // Check if translation is pending (for messages from others in a different language)
  const isTranslationPending =
    !isOwnMessage && // Only for received messages
    !isOptimisticMessage && // Not for optimistic messages
    !message.detectedSourceLanguage && // Language not detected yet
    preferredLanguage !== "English"; // User has non-English preference

  // Capitalize sender name for group chats
  const capitalizedSenderName = senderName
    ? senderName
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
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

        <TouchableOpacity
          style={[
            message.imageId ? styles.bubbleNoImage : styles.bubble,
            isOwnMessage
              ? {
                  backgroundColor: "#3460A0",
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
          onPress={hasTranslation ? toggleOriginal : undefined}
          disabled={!hasTranslation}
          activeOpacity={hasTranslation ? 0.7 : 1}
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
              {/* Main message text - show translation if available, loading if pending, otherwise original */}
              {isTranslationPending ? (
                <View
                  style={[
                    styles.translationLoadingContainer,
                    message.imageId && styles.translationLoadingWithImage,
                  ]}
                >
                  <ActivityIndicator size="small" color="#93C5FD" />
                  <Text style={styles.translationLoadingText}>
                    Translating...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.messageText,
                    message.imageId && styles.messageTextWithImage,
                  ]}
                >
                  {hasTranslation
                    ? cachedTranslation!.translatedText
                    : message.content}
                </Text>
              )}

              {/* Translation label below text */}
              {hasTranslation && (
                <Text
                  style={[
                    styles.translationLabelText,
                    message.imageId && styles.translationLabelWithImage,
                    isOwnMessage && styles.translationLabelOwn,
                  ]}
                >
                  {showOriginal
                    ? "Hide original"
                    : `Translated from ${sourceLanguage} to ${preferredLanguage}`}
                </Text>
              )}

              {/* Expanded section showing original + context */}
              {hasTranslation && showOriginal && (
                <View style={styles.expandedSection}>
                  {/* Divider */}
                  <View
                    style={[styles.divider, isOwnMessage && styles.dividerOwn]}
                  />

                  {/* Original message */}
                  <View style={styles.originalSection}>
                    <Text
                      style={[
                        styles.originalHeader,
                        isOwnMessage && styles.headerOwn,
                      ]}
                    >
                      Original Message
                    </Text>
                    <Text
                      style={[
                        styles.originalText,
                        isOwnMessage && styles.contentOwn,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>

                  {/* Cultural hints - from source language */}
                  {culturalHints && culturalHints.length > 0 && (
                    <View
                      style={[
                        styles.contextSection,
                        isOwnMessage && styles.contextSectionOwn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.contextHeader,
                          isOwnMessage && styles.headerOwn,
                        ]}
                      >
                        ℹ️ Cultural Context
                      </Text>
                      {culturalHints.map((hint, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.contextText,
                            isOwnMessage && styles.contentOwn,
                          ]}
                        >
                          • {hint}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Slang explanations - from source language */}
                  {slangExplanations && slangExplanations.length > 0 && (
                    <View
                      style={[
                        styles.contextSection,
                        isOwnMessage && styles.contextSectionOwn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slangHeader,
                          isOwnMessage && styles.headerOwn,
                        ]}
                      >
                        📚 Slang & Idioms
                      </Text>
                      {slangExplanations.map((item, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.contextText,
                            isOwnMessage && styles.contentOwn,
                          ]}
                        >
                          •{" "}
                          <Text
                            style={[
                              styles.slangTerm,
                              isOwnMessage && styles.contentOwn,
                            ]}
                          >
                            {item.term}
                          </Text>{" "}
                          - {item.explanation}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
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
        </TouchableOpacity>
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
  translationLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  translationLoadingWithImage: {
    paddingHorizontal: 12,
  },
  translationLoadingText: {
    fontSize: 14,
    color: "#93C5FD",
    fontStyle: "italic",
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
    color: "#000000",
    letterSpacing: -6,
  },
  translationLabelText: {
    fontSize: 11,
    color: "#93C5FD",
    fontWeight: "500",
    marginTop: 6,
  },
  translationLabelOwn: {
    color: "#000000",
  },
  translationLabelWithImage: {
    marginTop: 4,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(147, 197, 253, 0.2)",
    marginBottom: 12,
  },
  dividerOwn: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  originalSection: {
    marginBottom: 8,
  },
  originalHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#93C5FD",
    marginBottom: 4,
  },
  originalText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#E5E7EB",
    opacity: 0.9,
  },
  contextSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(147, 197, 253, 0.15)",
  },
  contextSectionOwn: {
    borderTopColor: "rgba(0, 0, 0, 0.2)",
  },
  contextHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#93C5FD",
    marginBottom: 6,
  },
  contextText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#C7D2FE",
    marginBottom: 4,
  },
  slangHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FCD34D",
    marginBottom: 6,
  },
  slangTerm: {
    fontWeight: "600",
    color: "#FEF3C7",
  },
  headerOwn: {
    color: "#000000",
  },
  contentOwn: {
    color: "#FFFFFF",
  },
});
