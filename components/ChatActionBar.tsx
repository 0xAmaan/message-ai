import { Text, TouchableOpacity, View } from "react-native";
import { Check, Trash2 } from "lucide-react-native";

interface ChatActionBarProps {
  selectedCount: number;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

export const ChatActionBar = ({
  selectedCount,
  onMarkAsRead,
  onDelete,
}: ChatActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <View
      className="absolute left-0 right-0 bg-background border-t border-gray-700"
      style={{
        bottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center justify-around py-3 px-4">
        {/* Mark as Read Button */}
        <TouchableOpacity
          onPress={onMarkAsRead}
          className="flex-row items-center justify-center bg-blue-600 rounded-lg px-6 py-3 flex-1 mr-2"
          activeOpacity={0.7}
        >
          <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
          <Text className="text-white font-semibold ml-2">Mark as Read</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={onDelete}
          className="flex-row items-center justify-center bg-red-600 rounded-lg px-6 py-3 flex-1 ml-2"
          activeOpacity={0.7}
        >
          <Trash2 color="#FFFFFF" size={20} strokeWidth={2.5} />
          <Text className="text-white font-semibold ml-2">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
