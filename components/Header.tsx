import { ChevronLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

interface HeaderProps {
  navigation: any;
  title?: string;
  profilePicUrl?: string;
}

const Header = ({ navigation, title, profilePicUrl }: HeaderProps) => {
  return (
    <View className="bg-background">
      <SafeAreaView edges={["top"]}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-5 bg-background">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center"
          >
            <ChevronLeft color="#3D88F7" size={20} />
            <Text className="text-lg text-blue-500">Back</Text>
          </TouchableOpacity>
          {title && (
            <View className="flex-1 flex-row items-center justify-center mr-12">
              {profilePicUrl && (
                <Image
                  source={{ uri: profilePicUrl }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    marginRight: 8,
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              )}
              <Text className="text-xl font-bold text-gray-50">
                {title}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Header;
