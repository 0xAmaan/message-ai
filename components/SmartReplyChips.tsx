import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Animated, StyleSheet } from "react-native";
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

  // Query smart replies from Convex for this specific user
  const smartReply = useQuery(api.smartReplies.getSmartReplies, {
    conversationId,
    userId: currentUserId,
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
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header with dismiss button */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Smart Replies
          </Text>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            activeOpacity={0.5}
          >
            <X color="#9CA3AF" size={16} />
          </TouchableOpacity>
        </View>

        {/* Reply chips */}
        <View style={styles.chipsContainer}>
          {smartReply.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectReply(suggestion)}
              style={styles.chip}
              activeOpacity={0.8}
            >
              <Text
                style={styles.chipText}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Generating suggestions...
        </Text>
      </View>

      <View style={styles.chipsContainer}>
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={[styles.shimmerChip, { opacity: shimmerOpacity }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  dismissButton: {
    padding: 4,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(61, 136, 247, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(61, 136, 247, 0.5)",
  },
  chipText: {
    fontSize: 14,
    textAlign: "center",
    color: "#93C5FD",
  },
  shimmerChip: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 9999,
    height: 32,
  },
});
