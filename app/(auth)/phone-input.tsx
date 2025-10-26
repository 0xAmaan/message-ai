import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Phone } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const PhoneInputScreen = () => {
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if ((!signUpLoaded && !signInLoaded) || (!signUp && !signIn)) return;

    try {
      setLoading(true);

      // Phone number must be in E.164 format
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+1${phoneNumber}`;

      // Try to sign up first
      if (signUp) {
        try {
          await signUp.create({
            phoneNumber: formattedPhone,
          });

          await signUp.preparePhoneNumberVerification();

          router.push({
            pathname: "/(auth)/verify-otp",
            params: { phoneNumber: formattedPhone, isSignUp: "true" },
          });
          return;
        } catch (signUpError: any) {
          // If phone already exists, try sign in instead
          if (
            signUpError.errors?.[0]?.code === "form_identifier_exists" ||
            signUpError.errors?.[0]?.message?.includes("already")
          ) {
            // Fall through to sign in logic below
          } else {
            throw signUpError;
          }
        }
      }

      // Sign in flow (if sign up failed due to existing phone)
      if (signIn) {
        console.log("=== STARTING SIGN IN FLOW ===");
        await signIn.create({
          identifier: formattedPhone,
        });

        await signIn.prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId: signIn.supportedFirstFactors.find(
            (f: any) => f.strategy === "phone_code",
          )?.phoneNumberId,
        });

        const navParams = {
          phoneNumber: formattedPhone,
          isSignUp: "false"
        };
        console.log("=== NAVIGATING TO VERIFY-OTP WITH PARAMS:", navParams);

        router.push({
          pathname: "/(auth)/verify-otp",
          params: navParams,
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error.errors?.[0]?.message || "Failed to send code");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 bg-background-base">
      <View className="items-center mt-10 mb-7">
        <Phone color="#3D88F7" size={48} strokeWidth={2} />
      </View>
      <Text className="text-3xl font-bold mb-2 text-gray-50 text-center">
        Your Phone
      </Text>
      <Text className="text-base text-gray-400 mb-10 text-center">
        Enter your phone number to get started
      </Text>

      <View className="mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Phone Number
        </Text>
        <TextInput
          className="border border-gray-700 bg-background rounded-lg p-4 text-base text-gray-50"
          placeholder="+1234567890"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          autoFocus
        />
        <Text className="text-xs text-gray-400 mt-1.5">
          Include country code (e.g., +1 for US)
        </Text>
      </View>

      <View className="items-center">
        <TouchableOpacity
          className={`p-4 rounded-lg items-center w-40 ${
            loading || !phoneNumber ? "bg-gray-700" : "bg-primary"
          }`}
          onPress={handleSubmit}
          disabled={loading || !phoneNumber}
        >
          <Text className="text-gray-50 text-base font-semibold">
            {loading ? "Sending..." : "Send Code"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhoneInputScreen;
