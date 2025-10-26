import { ChevronLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Header = ({ navigation }: { navigation: any }) => {
  return (
    <SafeAreaView edges={["top"]} className="bg-background">
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center"
        >
          <ChevronLeft color="#3D88F7" size={20} />
          <Text className="text-lg text-blue-500">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Header;
