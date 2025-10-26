import { forwardRef, useImperativeHandle, useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus } from "lucide-react-native";

interface MessageInputProps {
  onSend: (message: string) => void;
  onSendImage?: (uri: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export interface MessageInputRef {
  fillMessage: (text: string) => void;
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSend, onSendImage, onTypingChange }, ref) {
    const [message, setMessage] = useState("");

    // Expose fillMessage method to parent
    useImperativeHandle(ref, () => ({
      fillMessage: (text: string) => {
        setMessage(text);
        if (onTypingChange) {
          onTypingChange(text.length > 0);
        }
      },
    }));

  const handleTextChange = (text: string) => {
    setMessage(text);
    // Notify parent when user starts/stops typing
    if (onTypingChange) {
      onTypingChange(text.length > 0);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
      // User stopped typing after sending
      if (onTypingChange) {
        onTypingChange(false);
      }
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library to send images.",
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (onSendImage) {
          onSendImage(imageUri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <View className="flex-row p-2 bg-gray-800 border-t border-gray-700 items-end">
      {/* Image picker button */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full justify-center items-center mr-2 bg-gray-700 active:bg-gray-600"
        onPress={handlePickImage}
      >
        <ImagePlus color="#9CA3AF" size={20} />
      </TouchableOpacity>

      <View className="flex-1 bg-gray-700 rounded-3xl px-4 py-2 mr-2 min-h-[40px] max-h-[100px]">
        <TextInput
          className="text-base min-h-[24px] text-gray-50"
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />
      </View>

      <TouchableOpacity
        className={`w-10 h-10 rounded-full justify-center items-center ${
          message.trim()
            ? "bg-violet-600 active:bg-violet-700"
            : "bg-gray-600 opacity-50"
        }`}
        onPress={handleSend}
        disabled={!message.trim()}
      >
        <Text className="text-xl font-bold text-gray-50">
          ↑
        </Text>
      </TouchableOpacity>
    </View>
  );
});
