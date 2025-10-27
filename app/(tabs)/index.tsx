import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { SquarePen } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatListItem } from "../../components/ChatListItem";

const ChatsScreen = () => {
  const { user } = useUser();
  const router = useRouter();

  // Query conversations from Convex
  const conversations = useQuery(
    api.conversations.getUserConversations,
    user?.id ? { clerkId: user.id } : "skip",
  );

  // Loading state
  if (conversations === undefined) {
    return (
      <View className="flex-1 bg-background-base">
        <View className="bg-background">
          <SafeAreaView edges={["top"]}>
            <View className="flex-row items-center justify-between px-5 py-3 bg-background">
              <TouchableOpacity>
                <Text className="text-lg text-blue-500">Edit</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-50">Chats</Text>
              <TouchableOpacity onPress={() => router.push("/new-chat")}>
                <SquarePen color="#3D88F7" size={24} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
        <View className="flex-1 justify-center items-center bg-background-base">
          <ActivityIndicator size="large" color="#3D88F7" />
        </View>
      </View>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <View className="flex-1 bg-background-base">
        <View className="bg-background">
          <SafeAreaView edges={["top"]}>
            <View className="flex-row items-center justify-between px-5 pt-3 pb-5 bg-background">
              <TouchableOpacity>
                <Text className="text-lg text-blue-500">Edit</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-50">Chats</Text>
              <TouchableOpacity onPress={() => router.push("/new-chat")}>
                <SquarePen color="#3D88F7" size={24} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View className="flex-1 justify-center items-center px-10 bg-background-base">
          <Text className="text-6xl mb-4 pt-10">💬</Text>
          <Text className="text-xl font-bold text-gray-50 mb-2">
            No chats yet
          </Text>
          <Text className="text-sm text-gray-400 text-center mb-8">
            Start a conversation by tapping the button above
          </Text>
        </View>
      </View>
    );
  }

  // List of conversations
  return (
    <View className="flex-1 bg-background-base">
      <View className="bg-background">
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between px-5 py-3 bg-background">
            <TouchableOpacity>
              <Text className="text-lg text-blue-500">Edit</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-50">Chats</Text>
            <TouchableOpacity onPress={() => router.push("/new-chat")}>
              <SquarePen color="#3D88F7" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ChatListItem conversation={item} currentUserId={user?.id || ""} />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 bg-background-base"
      />
    </View>
  );
};

export default ChatsScreen;
