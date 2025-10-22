import { SignOutButton } from "@/components/SignOutButton";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Page() {
  const { user } = useUser();

  // Get user identifier - prefer username, fallback to phone, then email
  const userIdentifier =
    user?.username ||
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  return (
    <View>
      <SignedIn>
        <Text>Hello {userIdentifier}</Text>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/phone-input">
          <Text>Sign in</Text>
        </Link>
      </SignedOut>
    </View>
  );
}
