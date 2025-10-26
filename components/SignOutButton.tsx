import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { LogOut } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };
  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="w-10 h-10 rounded-full bg-gray-700 justify-center items-center active:opacity-80"
      style={{ backgroundColor: '#374151' }}
      activeOpacity={0.7}
    >
      <LogOut color="#F9FAFB" size={20} strokeWidth={2} />
    </TouchableOpacity>
  );
};
