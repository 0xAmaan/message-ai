import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Animated } from "react-native";
import { X } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SmartReplyChipsProps {
  conversationId: Id<"conversations">;
  currentUserId: string;
  onSelectReply: (text: string) => void;
  onDismiss: () => void;
}

export const SmartReplyChips = ({
  conversationId,
  currentUserId,
  onSelectReply,
  onDismiss,
}: SmartReplyChipsProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Query smart replies from Convex
  const smartReply = useQuery(api.smartReplies.getSmartReplies, {
    conversationId,
  });

  // Query messages to check if last message is from current user
  const messages = useQuery(api.messages.getMessages, {
    conversationId,
    limit: 1,
  });

  // Fade in animation when suggestions load
  useEffect(() => {
    if (smartReply?.suggestions && !isDismissed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [smartReply, isDismissed, fadeAnim]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsDismissed(true);
      onDismiss();
    });
  };

  const handleSelectReply = (suggestion: string) => {
    onSelectReply(suggestion);
    handleDismiss();
  };

  // Don't render if dismissed or no suggestions
  if (isDismissed || !smartReply?.suggestions || smartReply.suggestions.length === 0) {
    return null;
  }

  // Don't render if last message is from current user
  if (messages && messages.length > 0 && messages[messages.length - 1].senderId === currentUserId) {
    return null;
  }

  return (
    <View className="bg-gray-800 px-3 py-2 border-t border-gray-700">
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header with dismiss button */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-medium text-gray-400">
            Smart Replies
          </Text>
          <TouchableOpacity
            onPress={handleDismiss}
            className="p-1 active:opacity-50"
          >
            <X color="#9CA3AF" size={16} />
          </TouchableOpacity>
        </View>

        {/* Reply chips */}
        <View className="flex-row gap-2">
          {smartReply.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectReply(suggestion)}
              className="flex-1 rounded-full py-2 px-3 active:opacity-80"
              style={{
                backgroundColor: 'rgba(61, 136, 247, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(61, 136, 247, 0.5)'
              }}
            >
              <Text
                className="text-sm text-center text-blue-300"
                numberOfLines={1}
              >
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Loading shimmer component for when suggestions are being generated
export const SmartReplyChipsLoading = () => {
  const [shimmerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="bg-gray-800 px-3 py-2 border-t border-gray-700">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-medium text-gray-400">
          Generating suggestions...
        </Text>
      </View>

      <View className="flex-row gap-2">
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            className="flex-1 bg-gray-700 rounded-full h-8"
            style={{ opacity: shimmerOpacity }}
          />
        ))}
      </View>
    </View>
  );
};
