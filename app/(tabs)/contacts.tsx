import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      // Remove country code
      const withoutCountry = cleaned.slice(1);
      return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Return original if not a standard US format
    return phoneNumber;
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Filter out current user and apply search
  const contacts =
    allUsers
      ?.filter((contact) => contact.clerkId !== user?.id)
      .filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ) || [];

  return (
    <View className="flex-1 bg-background-base">
      {/* Status bar background */}
      <View className="bg-background">
        <SafeAreaView edges={["top"]}>
          {/* Custom Header */}
          <View className="flex items-center justify-between px-5 py-3 bg-background">
            <Text className="text-xl font-bold text-foreground">Contacts</Text>
          </View>

          {/* Search Bar */}
          <View className="px-5 pb-3 bg-background">
            <View className="flex-row items-center bg-background-base rounded-lg px-3 py-2.5">
              <Search color="#9CA3AF" size={20} />
              <TextInput
                className="flex-1 ml-2 text-gray-50 text-base"
                placeholder="Search contacts..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Loading State */}
      {allUsers === undefined ? (
        <View className="flex-1 justify-center items-center bg-background-base">
          <ActivityIndicator size="large" color="#3D88F7" />
        </View>
      ) : contacts.length === 0 ? (
        // Empty State
        <View className="flex-1 justify-center items-center px-10 bg-background-base">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-bold mb-2 text-gray-50">
            {searchQuery ? "No contacts found" : "No contacts yet"}
          </Text>
          <Text className="text-sm text-center text-gray-400">
            {searchQuery
              ? "Try a different search term"
              : "Contacts will appear here once other users sign up"}
          </Text>
        </View>
      ) : (
        // Contacts List
        <FlatList
          data={contacts}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-700 bg-background-base active:bg-gray-900"
              onPress={() => handleStartChat(item.clerkId)}
              activeOpacity={0.7}
            >
              {/* Profile Picture */}
              <View className="w-10 h-10 rounded-full bg-primary justify-center items-center mr-4 relative">
                <Text className="text-base font-semibold text-gray-50">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
                {/* Online Indicator */}
                {item.isOnline && (
                  <View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background-base" />
                )}
              </View>

              {/* User Info */}
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-1 text-gray-50">
                  {capitalizeFirstLetter(item.name)}
                </Text>
                <Text className="text-base text-gray-400">
                  {formatPhoneNumber(item.phoneNumber)}
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
          className="flex-1 bg-background-base"
        />
      )}
    </View>
  );
};

export default ContactsScreen;
