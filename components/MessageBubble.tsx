import { Id } from "@/convex/_generated/dataModel";
import { Text, View, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TranslateButton } from "./TranslateButton";
import { useState, useEffect } from "react";

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

export const MessageBubble = ({
  message,
  isOwnMessage,
  isPending,
  currentUserId,
}: MessageBubbleProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
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

  // Auto-show translation when cache updates after translating
  useEffect(() => {
    console.log("useEffect - cachedTranslation:", cachedTranslation);
    console.log("useEffect - isTranslating:", isTranslating);

    if (cachedTranslation && isTranslating) {
      console.log("Translation cache updated, showing translation");
      setShowTranslation(true);
      setIsTranslating(false);
    }
  }, [cachedTranslation, isTranslating]);

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
    console.log("Local translation:", localTranslation);

    // Toggle if already translated (either cached or local)
    if (cachedTranslation || localTranslation) {
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
        // Store the translation locally and show it immediately
        setLocalTranslation(result);
        setShowTranslation(true);
        setIsTranslating(false);
      } else {
        // If no result, stop loading
        setIsTranslating(false);
      }
    } catch (error) {
      console.error("Translation error:", error);
      setIsTranslating(false);
      Alert.alert(
        "Translation Failed",
        error instanceof Error ? error.message : "Failed to translate message",
      );
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
  // AND only for saved messages (not optimistic/pending messages)
  const isOptimisticMessage = typeof message._id === "string" && message._id.startsWith("temp-");
  const showTranslateButton =
    !isOwnMessage &&
    currentUserId &&
    message.content.trim().length > 0 &&
    !isOptimisticMessage; // Only show for DB-saved messages

  return (
    <View
      className={`mb-2 flex-row ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <View className={`max-w-[75%]`}>
        <View
          className={`${message.imageId ? "px-0 py-0" : "px-3 py-2"} rounded-lg ${
            isOwnMessage
              ? "rounded-br-sm"
              : "bg-gray-700 rounded-bl-sm"
          }`}
          style={isOwnMessage ? { backgroundColor: '#3D88F7' } : {}}
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
                  <ActivityIndicator size="small" color="#3D88F7" />
                </View>
              )}
            </View>
          )}

          {/* Text content if present */}
          {message.content && (
            <Text
              className={`text-base leading-5 mb-1 text-gray-50 ${message.imageId ? "px-3 py-2" : ""}`}
            >
              {message.content}
            </Text>
          )}

          {/* Timestamp and read receipts */}
          <View
            className={`flex-row items-center justify-end mt-0.5 ${message.imageId ? "px-3 pb-2" : ""}`}
          >
            <Text
              className={`text-[11px] ${isOwnMessage ? "text-gray-200" : "text-gray-400"}`}
            >
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <Text className="text-xs ml-1 text-blue-400">
                {isPending ? "⏱" : readByOthers > 0 ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </View>

        {/* Translation Overlay */}
        {showTranslation && (cachedTranslation || localTranslation) && (() => {
          // Use cachedTranslation if available, otherwise use localTranslation
          const translation = cachedTranslation || localTranslation;
          if (!translation) return null;

          const translatedText = cachedTranslation
            ? cachedTranslation.translatedText
            : localTranslation!.translation;
          const detectedLang = cachedTranslation
            ? cachedTranslation.detectedSourceLanguage
            : localTranslation!.detectedLanguage;
          const culturalHints = cachedTranslation
            ? cachedTranslation.culturalHints
            : localTranslation!.culturalHints;
          const slangExplanations = cachedTranslation
            ? cachedTranslation.slangExplanations
            : localTranslation!.slangExplanations;

          return (
            <View className="mt-2 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(61, 136, 247, 0.15)' }}>
              {/* Language indicator */}
              <View className="flex-row items-center mb-3">
                <Text className="text-xs font-medium text-blue-300">
                  {getFlagEmoji(detectedLang)} {detectedLang} → 🇺🇸 English
                </Text>
              </View>

              {/* Divider */}
              <View className="h-px mb-3" style={{ backgroundColor: 'rgba(61, 136, 247, 0.3)' }} />

              {/* Translated text */}
              <Text className="text-base leading-6 mb-1 text-gray-50">
                {translatedText}
              </Text>

              {/* Cultural hints */}
              {culturalHints.length > 0 && (
                <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: 'rgba(61, 136, 247, 0.3)' }}>
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
                <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: 'rgba(61, 136, 247, 0.3)' }}>
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
