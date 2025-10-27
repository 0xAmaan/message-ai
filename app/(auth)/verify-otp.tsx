import Header from "@/components/Header";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const VerifyOTPScreen = () => {
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle params that might be arrays or undefined
  const phoneNumber = typeof params.phoneNumber === "string"
    ? params.phoneNumber
    : Array.isArray(params.phoneNumber)
      ? params.phoneNumber[0]
      : "";

  const isSigningUp = typeof params.isSignUp === "string"
    ? params.isSignUp === "true"
    : Array.isArray(params.isSignUp)
      ? params.isSignUp[0] === "true"
      : true;

  const handleVerify = async () => {
    if (isSigningUp && (!signUpLoaded || !signUp)) return;
    if (!isSigningUp && (!signInLoaded || !signIn)) return;

    try {
      setLoading(true);

      // Handle Sign In
      if (!isSigningUp && signIn) {
        const signInAttempt = await signIn.attemptFirstFactor({
          strategy: "phone_code",
          code,
        });

        if (signInAttempt.status === "complete") {
          await setActiveSignIn({ session: signInAttempt.createdSessionId! });
          router.replace("/(tabs)");
        } else {
          Alert.alert("Error", "Sign in incomplete. Please try again.");
        }
        return;
      }

      // Handle Sign Up
      if (!signUp) return;
      const signUpAttempt = await signUp.attemptPhoneNumberVerification({
        code,
      });

      // Handle different sign-up statuses
      if (signUpAttempt.status === "complete") {
        if (signUpAttempt.createdSessionId) {
          await setActiveSignUp({ session: signUpAttempt.createdSessionId });
          router.replace("/(auth)/profile-setup");
        } else {
          Alert.alert(
            "Error",
            "Sign-up completed but session creation failed. Please try again.",
          );
        }
      } else if (signUpAttempt.status === "missing_requirements") {
        if (signUpAttempt.missingFields?.includes("username")) {
          router.replace("/(auth)/username-setup");
        } else {
          try {
            const updatedSignUp = await signUp.update({});

            if (updatedSignUp.createdSessionId) {
              await setActiveSignUp({ session: updatedSignUp.createdSessionId });
              router.replace("/(auth)/profile-setup");
            } else if (updatedSignUp.status === "complete") {
              router.replace("/(auth)/profile-setup");
            } else {
              Alert.alert(
                "Additional Information Required",
                `Please provide: ${updatedSignUp.missingFields?.join(", ") || "additional information"}`,
              );
            }
          } catch (updateError: any) {
            Alert.alert(
              "Error",
              updateError.errors?.[0]?.message || "Failed to complete sign-up",
            );
          }
        }
      } else {
        Alert.alert(
          "Verification Error",
          `Unexpected status: ${signUpAttempt.status}. Please try again.`,
        );
      }
    } catch (error: any) {
      console.error("Verification error:", error);

      const errorMessage =
        error.errors?.[0]?.message || error.message || "Invalid code";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (isSigningUp && signUp) {
        await signUp.preparePhoneNumberVerification();
      } else if (!isSigningUp && signIn) {
        await signIn.prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId: signIn.supportedFirstFactors.find(
            (f: any) => f.strategy === "phone_code",
          )?.phoneNumberId,
        });
      }
      Alert.alert("Success", "A new code has been sent");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.errors?.[0]?.message || "Failed to resend code",
      );
    }
  };

  return (
    <View className="flex-1 bg-background-base">
      <Header navigation={navigation} title="MessageAI" />
      <View className="flex-1 p-5">
      <Text className="text-3xl font-bold mt-10 mb-2 text-gray-50 text-center">
        {isSigningUp ? "Verify Your Phone" : "Welcome Back"}
      </Text>
      <Text className="text-base text-gray-400 mb-10 text-center">
        Enter the 6-digit code sent to{"\n"}
        {phoneNumber}
      </Text>

      <View className="mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Verification Code
        </Text>
        <View className="border border-gray-700 bg-background rounded-lg p-4">
          <TextInput
            style={{
              fontSize: 24,
              textAlign: "center",
              letterSpacing: 8,
              color: "#F9FAFB"
            }}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            autoFocus
          />
        </View>
      </View>

      <View className="items-center">
        <TouchableOpacity
          className={`p-4 rounded-lg items-center w-40 mb-5 ${
            loading || code.length !== 6 ? "bg-gray-700" : "bg-primary"
          }`}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
        >
          <Text className="text-gray-50 text-base font-semibold">
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleResend} className="items-center">
        <Text className="text-primary text-sm">
          Didn&apos;t receive code? Resend
        </Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default VerifyOTPScreen;
