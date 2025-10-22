import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface MessageInputProps {
  onSend: (message: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <View className="flex-row p-2 bg-gray-800 border-t border-gray-700 items-end">
      <View className="flex-1 bg-gray-700 rounded-3xl px-4 py-2 mr-2 min-h-[40px] max-h-[100px]">
        <TextInput
          className="text-base text-gray-50 min-h-[24px]"
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
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
        <Text className="text-gray-50 text-xl font-bold">↑</Text>
      </TouchableOpacity>
    </View>
  );
}
