import { useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function VerifyOTPScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);

      // Attempt to verify the phone number with the provided code
      const signUpAttempt = await signUp.attemptPhoneNumberVerification({
        code,
      });

      console.log("Sign up attempt status:", signUpAttempt.status);
      console.log("Created session ID:", signUpAttempt.createdSessionId);
      console.log("Missing fields:", signUpAttempt.missingFields);
      console.log("Unverified fields:", signUpAttempt.unverifiedFields);

      // Handle different sign-up statuses
      if (signUpAttempt.status === "complete") {
        // Sign-up is fully complete with a session
        if (signUpAttempt.createdSessionId) {
          await setActive({ session: signUpAttempt.createdSessionId });
          console.log("Session activated successfully!");
          router.replace("/(auth)/profile-setup");
        } else {
          console.error("Sign up complete but no session ID");
          Alert.alert(
            "Error",
            "Sign-up completed but session creation failed. Please try again.",
          );
        }
      } else if (signUpAttempt.status === "missing_requirements") {
        // Phone is verified, but Clerk needs more info or needs to finalize the sign-up
        console.log("Phone verified, but missing requirements detected");
        console.log("Missing fields:", signUpAttempt.missingFields);

        // Check if username is one of the missing fields
        if (signUpAttempt.missingFields?.includes("username")) {
          console.log("Username is required, redirecting to username setup");
          // Navigate to username setup screen
          router.replace("/(auth)/username-setup");
        } else {
          // Try to update with an empty object to see if we can complete sign-up
          try {
            const updatedSignUp = await signUp.update({});

            console.log("Updated sign up status:", updatedSignUp.status);
            console.log("Updated session ID:", updatedSignUp.createdSessionId);

            if (updatedSignUp.createdSessionId) {
              await setActive({ session: updatedSignUp.createdSessionId });
              console.log("Session activated after update!");
              router.replace("/(auth)/profile-setup");
            } else if (updatedSignUp.status === "complete") {
              console.log(
                "Sign-up marked complete, navigating to profile setup",
              );
              router.replace("/(auth)/profile-setup");
            } else {
              console.error(
                "Still missing requirements:",
                updatedSignUp.missingFields,
              );
              Alert.alert(
                "Additional Information Required",
                `Please provide: ${updatedSignUp.missingFields?.join(", ") || "additional information"}`,
              );
            }
          } catch (updateError: any) {
            console.error("Error updating sign-up:", updateError);
            Alert.alert(
              "Error",
              updateError.errors?.[0]?.message || "Failed to complete sign-up",
            );
          }
        }
      } else {
        // Handle other statuses
        console.error("Unexpected sign-up status:", signUpAttempt.status);
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
    if (!isLoaded || !signUp) return;

    try {
      await signUp.preparePhoneNumberVerification();
      Alert.alert("Success", "A new code has been sent");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.errors?.[0]?.message || "Failed to resend code",
      );
    }
  };

  return (
    <View className="flex-1 p-5 bg-gray-900">
      <Text className="text-3xl font-bold mt-10 mb-2 text-gray-50">
        Verify Your Phone
      </Text>
      <Text className="text-base text-gray-400 mb-10">
        Enter the 6-digit code sent to{"\n"}
        {phoneNumber}
      </Text>

      <View className="mb-8">
        <Text className="text-base font-semibold mb-2 text-gray-50">
          Verification Code
        </Text>
        <TextInput
          className="border border-gray-700 bg-gray-800 rounded-lg p-4 text-2xl text-center tracking-widest text-gray-50"
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity
        className={`bg-violet-600 p-4 rounded-lg items-center mb-5 ${loading || code.length !== 6 ? "opacity-60" : "active:bg-violet-700"}`}
        onPress={handleVerify}
        disabled={loading || code.length !== 6}
      >
        <Text className="text-gray-50 text-base font-semibold">
          {loading ? "Verifying..." : "Verify"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} className="items-center">
        <Text className="text-violet-400 text-sm">
          Didn&apos;t receive code? Resend
        </Text>
      </TouchableOpacity>
    </View>
  );
}
