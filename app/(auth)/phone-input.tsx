import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PhoneInputScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);

      // Phone number must be in E.164 format
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+1${phoneNumber}`;

      // Create sign up with phone number
      await signUp.create({
        phoneNumber: formattedPhone,
      });

      // Send OTP via SMS
      await signUp.preparePhoneNumberVerification();

      // Navigate to OTP verification screen
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phoneNumber: formattedPhone },
      });
    } catch (error: any) {
      Alert.alert("Error", error.errors?.[0]?.message || "Failed to send code");
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 bg-gray-900">
      <Text className="text-3xl font-bold mt-10 mb-2 text-gray-50">
        Welcome to MessageAI
      </Text>
      <Text className="text-base text-gray-400 mb-10">
        Enter your phone number to get started
      </Text>

      <View className="mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Phone Number
        </Text>
        <TextInput
          className="border border-gray-700 bg-gray-800 rounded-lg p-4 text-base text-gray-50"
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

      <TouchableOpacity
        className={`bg-violet-600 p-4 rounded-lg items-center ${loading || !phoneNumber ? "opacity-60" : "active:bg-violet-700"}`}
        onPress={handleSubmit}
        disabled={loading || !phoneNumber}
      >
        <Text className="text-gray-50 text-base font-semibold">
          {loading ? "Sending..." : "Send Code"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
