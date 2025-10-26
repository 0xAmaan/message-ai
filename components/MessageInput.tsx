import * as ImagePicker from "expo-image-picker";
import { ImagePlus } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
      <View style={styles.container}>
        {/* Image picker button */}
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
          <View style={styles.iconButton}>
            <ImagePlus color="#9CA3AF" size={20} />
          </View>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Message"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim()}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sendButton,
              {
                backgroundColor: message.trim() ? "#3D88F7" : "#1a1a1a",
                opacity: message.trim() ? 1 : 1,
              },
            ]}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 16,
    color: "#F9FAFB",
    minHeight: 24,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
});
