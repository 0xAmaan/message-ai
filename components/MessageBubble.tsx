import { Id } from "@/convex/_generated/dataModel";
import { Text, View, ActivityIndicator, Alert } from "react-native";
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
}

export function MessageBubble({
  message,
  isOwnMessage,
  isPending,
  currentUserId,
}: MessageBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Get image URL if message has an image
  const imageUrl = useQuery(
    api.messages.getImageUrl,
    message.imageId ? { imageId: message.imageId } : "skip",
  );

  // Get cached translation if it exists
  const cachedTranslation = useQuery(
    api.translations.getTranslation,
    typeof message._id === "string" || !currentUserId
      ? "skip"
      : {
          messageId: message._id as Id<"messages">,
          targetLanguage: "English",
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
    console.log("🌐 Translate button clicked");
    console.log("Message ID:", message._id);
    console.log("Current User ID:", currentUserId);
    console.log("Cached translation:", cachedTranslation);

    // Toggle if already translated
    if (cachedTranslation) {
      console.log("Toggle translation visibility");
      setShowTranslation(!showTranslation);
      return;
    }

    // Don't translate if missing required data or if it's an optimistic message
    const isOptimisticMessage = typeof message._id === "string" && message._id.startsWith("temp-");

    if (
      isOptimisticMessage ||
      !currentUserId ||
      !message.content.trim()
    ) {
      console.log("Missing required data for translation");
      console.log("Is optimistic message:", isOptimisticMessage);
      console.log("Has user ID:", !!currentUserId);
      console.log("Has content:", !!message.content.trim());
      return;
    }

    console.log("Starting translation...");
    setIsTranslating(true);
    try {
      const result = await translateMessage({
        messageId: message._id as Id<"messages">,
        targetLanguage: "English",
        userId: currentUserId,
      });

      console.log("Translation result:", result);

      if (result) {
        setShowTranslation(true);
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

  // Only show translate button for other users' messages with text content
  // AND only for saved messages (not optimistic/pending messages with string IDs)
  const showTranslateButton =
    !isOwnMessage &&
    currentUserId &&
    message.content.trim().length > 0 &&
    typeof message._id !== "string"; // Only show for DB-saved messages

  return (
    <View
      className={`mb-2 flex-row ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <View className={`max-w-[75%]`}>
        <View
          className={`${message.imageId ? "px-0 py-0" : "px-3 py-2"} rounded-lg ${
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

        {/* Translation Overlay */}
        {showTranslation && cachedTranslation && (
          <View
            className="mt-2 px-3 py-3 rounded-lg"
            style={{ backgroundColor: "#2D1B4E" }}
          >
            {/* Language indicator */}
            <View className="flex-row items-center mb-2">
              <Text className="text-xs" style={{ color: "#C4B5FD" }}>
                {getFlagEmoji(cachedTranslation.detectedSourceLanguage)}{" "}
                {cachedTranslation.detectedSourceLanguage} → 🇺🇸 English
              </Text>
            </View>

            {/* Divider */}
            <View
              className="h-px mb-2"
              style={{ backgroundColor: "#4C1D95" }}
            />

            {/* Translated text */}
            <Text className="text-base leading-5 mb-2" style={{ color: "#F9FAFB" }}>
              {cachedTranslation.translatedText}
            </Text>

            {/* Cultural hints */}
            {cachedTranslation.culturalHints.length > 0 && (
              <View className="mt-2">
                <Text
                  className="text-xs font-semibold mb-1"
                  style={{ color: "#93C5FD" }}
                >
                  ℹ️ Cultural Context:
                </Text>
                {cachedTranslation.culturalHints.map((hint, index) => (
                  <Text
                    key={index}
                    className="text-xs leading-4 mb-1"
                    style={{ color: "#E0E7FF" }}
                  >
                    • {hint}
                  </Text>
                ))}
              </View>
            )}

            {/* Slang explanations */}
            {cachedTranslation.slangExplanations.length > 0 && (
              <View className="mt-2">
                <Text
                  className="text-xs font-semibold mb-1"
                  style={{ color: "#FCD34D" }}
                >
                  📚 Slang & Idioms:
                </Text>
                {cachedTranslation.slangExplanations.map((item, index) => (
                  <Text
                    key={index}
                    className="text-xs leading-4 mb-1"
                    style={{ color: "#FEF3C7" }}
                  >
                    • <Text style={{ fontWeight: "600" }}>{item.term}</Text> -{" "}
                    {item.explanation}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

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
}
