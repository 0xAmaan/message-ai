import { SignOutButton } from "@/components/SignOutButton";
import { useUser } from "@clerk/clerk-expo";
import { Bell, Lock, Moon, User } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SettingsScreen = () => {
  const { user } = useUser();

  const userIdentifier =
    user?.username ||
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  return (
    <View className="flex-1 bg-background-base">
      <View className="bg-background">
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between px-5 py-3 bg-background">
            <View className="w-12" />
            <Text className="text-xl font-bold text-gray-50">Settings</Text>
            <View className="w-12" />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1">
        {/* Profile Section */}
        <View className="bg-background-base border-b border-gray-700 p-5">
          <Text className="text-sm text-gray-400 mb-3">PROFILE</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {/* Profile Picture */}
              <View className="w-16 h-16 rounded-full bg-primary justify-center items-center mr-4">
                <Text className="text-2xl font-semibold text-gray-50">
                  {userIdentifier.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* User Info */}
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-50 mb-1">
                  {userIdentifier}
                </Text>
                {user?.primaryPhoneNumber?.phoneNumber && (
                  <Text className="text-sm text-gray-400">
                    {user.primaryPhoneNumber.phoneNumber}
                  </Text>
                )}
              </View>
            </View>

            {/* Logout Button */}
            <SignOutButton />
          </View>
        </View>

        {/* Settings Options */}
        <View className="mt-4">
          <Text className="text-sm text-gray-400 px-5 mb-2">PREFERENCES</Text>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-background-base border-b border-gray-700 active:bg-gray-900"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center mr-4">
              <User color="#3D88F7" size={20} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-50 mb-0.5">
                Edit Profile
              </Text>
              <Text className="text-sm text-gray-400">
                Update your name and photo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-background-base border-b border-gray-700 active:bg-gray-900"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center mr-4">
              <Bell color="#3D88F7" size={20} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-50 mb-0.5">
                Notifications
              </Text>
              <Text className="text-sm text-gray-400">
                Manage notification preferences
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-background-base border-b border-gray-700 active:bg-gray-900"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center mr-4">
              <Lock color="#3D88F7" size={20} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-50 mb-0.5">
                Privacy
              </Text>
              <Text className="text-sm text-gray-400">
                Control your privacy settings
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-background-base border-b border-gray-700 active:bg-gray-900"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center mr-4">
              <Moon color="#3D88F7" size={20} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-50 mb-0.5">
                Appearance
              </Text>
              <Text className="text-sm text-gray-400">
                Theme and display options
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
