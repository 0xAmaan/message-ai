import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useNavigation } from "expo-router";
import { SquarePen } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatListItem } from "../../components/ChatListItem";
import { ChatActionBar } from "../../components/ChatActionBar";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

const ChatsScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<Id<"conversations">>>(new Set());

  // Mutations
  const markMultipleAsRead = useMutation(api.messages.markMultipleConversationsAsRead);
  const softDeleteConversation = useMutation(api.conversations.softDeleteConversation);

  // Hide/show tab bar based on edit mode
  useEffect(() => {
    navigation.setOptions({
      tabBarVisible: !isEditMode,
    });
  }, [isEditMode, navigation]);

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Exiting edit mode - clear selections
      setSelectedConversations(new Set());
    }
  };

  // Toggle conversation selection
  const toggleConversationSelection = (conversationId: Id<"conversations">) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedConversations(newSelected);
  };

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (!user?.id || selectedConversations.size === 0) return;

    try {
      await markMultipleAsRead({
        conversationIds: Array.from(selectedConversations),
        userId: user.id,
      });

      // Exit edit mode and clear selections
      setIsEditMode(false);
      setSelectedConversations(new Set());
    } catch (error) {
      Alert.alert("Error", "Failed to mark conversations as read");
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedConversations.size === 0) return;

    Alert.alert(
      "Delete Conversations",
      `Delete ${selectedConversations.size} conversation${selectedConversations.size > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;

            try {
              // Delete each selected conversation
              for (const conversationId of selectedConversations) {
                await softDeleteConversation({
                  conversationId,
                  userId: user.id,
                });
              }

              // Exit edit mode and clear selections
              setIsEditMode(false);
              setSelectedConversations(new Set());
            } catch (error) {
              Alert.alert("Error", "Failed to delete conversations");
            }
          },
        },
      ]
    );
  };

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
              <TouchableOpacity onPress={toggleEditMode}>
                <Text className="text-lg text-blue-500">
                  {isEditMode ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-50">Chats</Text>
              {!isEditMode && (
                <TouchableOpacity onPress={() => router.push("/new-chat")}>
                  <SquarePen color="#3D88F7" size={24} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
              {isEditMode && <View style={{ width: 24 }} />}
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
              <TouchableOpacity onPress={toggleEditMode}>
                <Text className="text-lg text-blue-500">
                  {isEditMode ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-50">Chats</Text>
              {!isEditMode && (
                <TouchableOpacity onPress={() => router.push("/new-chat")}>
                  <SquarePen color="#3D88F7" size={24} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
              {isEditMode && <View style={{ width: 24 }} />}
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
            <TouchableOpacity onPress={toggleEditMode}>
              <Text className="text-lg text-blue-500">
                {isEditMode ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-50">Chats</Text>
            {!isEditMode && (
              <TouchableOpacity onPress={() => router.push("/new-chat")}>
                <SquarePen color="#3D88F7" size={24} strokeWidth={2} />
              </TouchableOpacity>
            )}
            {isEditMode && <View style={{ width: 24 }} />}
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ChatListItem
            conversation={item}
            currentUserId={user?.id || ""}
            isEditMode={isEditMode}
            isSelected={selectedConversations.has(item._id)}
            onToggleSelect={() => toggleConversationSelection(item._id)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 bg-background-base"
      />

      {/* Action Bar */}
      <ChatActionBar
        selectedCount={selectedConversations.size}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </View>
  );
};

export default ChatsScreen;
