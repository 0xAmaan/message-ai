import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { LogOut } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
    <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
      <View style={styles.button}>
        <LogOut color="#F9FAFB" size={20} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8D2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
});
