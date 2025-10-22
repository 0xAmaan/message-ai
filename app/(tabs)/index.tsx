import { SignOutButton } from "@/components/SignOutButton";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatListItem } from "../../components/ChatListItem";

export default function ChatsScreen() {
  const { user } = useUser();
  const router = useRouter();

  // Query conversations from Convex
  const conversations = useQuery(
    api.conversations.getUserConversations,
    user?.id ? { clerkId: user.id } : "skip",
  );

  const userIdentifier =
    user?.username ||
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  // Loading state
  if (conversations === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900" edges={["top", "bottom"]}>
        <View className="flex-row justify-between items-center p-5 bg-gray-800 border-b border-gray-700">
          <View>
            <Text className="text-sm text-gray-400">Welcome back,</Text>
            <Text className="text-xl font-bold text-gray-50 mt-1">
              {userIdentifier}
            </Text>
          </View>
          <SignOutButton />
        </View>
        <View className="flex-1 justify-center items-center bg-gray-900">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900" edges={["top", "bottom"]}>
        <View className="flex-row justify-between items-center p-5 bg-gray-800 border-b border-gray-700">
          <View>
            <Text className="text-sm text-gray-400">Welcome back,</Text>
            <Text className="text-xl font-bold text-gray-50 mt-1">
              {userIdentifier}
            </Text>
          </View>
          <SignOutButton />
        </View>

        <View className="flex-1 justify-center items-center px-10 bg-gray-900">
          <Text className="text-6xl mb-4">💬</Text>
          <Text className="text-xl font-bold text-gray-50 mb-2">
            No chats yet
          </Text>
          <Text className="text-sm text-gray-400 text-center mb-8">
            Start a conversation by tapping the button below
          </Text>

          <TouchableOpacity
            className="bg-violet-600 px-8 py-4 rounded-full active:bg-violet-700"
            onPress={() => router.push("/new-chat")}
          >
            <Text className="text-gray-50 text-base font-semibold">
              + New Chat
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // List of conversations
  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={["top", "bottom"]}>
      <View className="flex-row justify-between items-center p-5 bg-gray-800 border-b border-gray-700">
        <View>
          <Text className="text-sm text-gray-400">Welcome back,</Text>
          <Text className="text-xl font-bold text-gray-50 mt-1">
            {userIdentifier}
          </Text>
        </View>
        <SignOutButton />
      </View>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ChatListItem conversation={item} currentUserId={user?.id || ""} />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        style={{ flex: 1, backgroundColor: "#111827" }}
      />

      {/* Floating action button for new chat */}
      <TouchableOpacity
        className="absolute right-5 bottom-20 w-14 h-14 rounded-full bg-violet-600 justify-center items-center active:bg-violet-700 shadow-lg"
        onPress={() => router.push("/new-chat")}
      >
        <Plus color="#F9FAFB" size={28} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
