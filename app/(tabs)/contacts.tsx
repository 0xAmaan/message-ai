import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ContactsScreen = () => {
  const { user } = useUser();
  const router = useRouter();

  // Get all users
  const allUsers = useQuery(api.users.listUsers);

  // Mutation to create or get conversation
  const createOrGetConversation = useMutation(
    api.conversations.createOrGetConversation,
  );

  const handleStartChat = async (contactId: string) => {
    if (!user?.id) return;

    try {
      const conversationId = await createOrGetConversation({
        participants: [user.id, contactId],
        type: "direct",
      });

      router.push(`/chat/${conversationId}` as any);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    }
  };

  // Filter out current user
  const contacts =
    allUsers?.filter((contact) => contact.clerkId !== user?.id) || [];

  return (
    <View className="flex-1 bg-gray-900">
      <SafeAreaView edges={["top"]}>
        <View className="p-5 bg-gray-800 border-b border-gray-700">
          <Text className="text-2xl font-bold text-gray-50">Contacts</Text>
          <Text className="text-sm text-gray-400 mt-1">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </Text>
        </View>
      </SafeAreaView>

      {/* Loading State */}
      {allUsers === undefined ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3D88F7" />
        </View>
      ) : contacts.length === 0 ? (
        // Empty State
        <View className="flex-1 justify-center items-center px-10">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-bold mb-2 text-gray-50">
            No contacts yet
          </Text>
          <Text className="text-sm text-center text-gray-400">
            Contacts will appear here once other users sign up
          </Text>
        </View>
      ) : (
        // Contacts List
        <FlatList
          data={contacts}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-700 bg-gray-800 active:bg-gray-700"
              onPress={() => handleStartChat(item.clerkId)}
              activeOpacity={0.7}
            >
              {/* Profile Picture */}
              <View className="w-14 h-14 rounded-full justify-center items-center mr-4 relative" style={{ backgroundColor: '#3D88F7' }}>
                <Text className="text-xl font-semibold text-gray-50">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
                {/* Online Indicator */}
                {item.isOnline && (
                  <View className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-800" />
                )}
              </View>

              {/* User Info */}
              <View className="flex-1">
                <Text className="text-base font-semibold mb-1 text-gray-50">
                  {item.name}
                </Text>
                <Text className="text-sm text-gray-400">
                  {item.phoneNumber}
                </Text>
              </View>

              {/* Online Badge */}
              {item.isOnline && (
                <View className="bg-emerald-500 px-2 py-1 rounded-xl">
                  <Text className="text-xs font-semibold text-gray-50">
                    Online
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="flex-1"
        />
      )}
    </View>
  );
};

export default ContactsScreen;
