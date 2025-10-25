import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

interface TranslateButtonProps {
  isTranslating: boolean;
  isTranslated: boolean;
  onPress: () => void;
  isOwnMessage: boolean;
}

export const TranslateButton = ({
  isTranslating,
  isTranslated,
  onPress,
  isOwnMessage,
}: TranslateButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mt-1 flex-row items-center"
      disabled={isTranslating}
    >
      {isTranslating ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text className="text-xs ml-2" style={{ color: "#9CA3AF" }}>
            Translating...
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center">
          <Text className="text-sm">🌐</Text>
          <Text
            className="text-xs ml-1"
            style={{ color: isOwnMessage ? "#C4B5FD" : "#A78BFA" }}
          >
            {isTranslated ? "Hide Translation" : "Translate"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
