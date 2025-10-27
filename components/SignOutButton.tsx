import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { StyleSheet, TouchableOpacity, Text } from "react-native";

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
      activeOpacity={0.7}
      style={styles.button}
    >
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
