import { ChevronLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Header = ({ navigation, title }: { navigation: any; title?: string }) => {
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
            <Text className="text-xl font-bold text-gray-50 flex-1 text-center mr-12">
              {title}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Header;
