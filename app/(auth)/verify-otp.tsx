import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function VerifyOTPScreen() {
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  console.log("=== VERIFY OTP SCREEN LOADED ===");
  console.log("Raw params:", JSON.stringify(params));
  console.log("params.phoneNumber type:", typeof params.phoneNumber);
  console.log("params.isSignUp type:", typeof params.isSignUp);

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

  console.log("Parsed phoneNumber:", phoneNumber);
  console.log("Parsed isSigningUp:", isSigningUp);

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
    <View style={{ flex: 1, padding: 20, backgroundColor: "#111827" }}>
      <Text style={{ fontSize: 30, fontWeight: "bold", marginTop: 40, marginBottom: 8, color: "#F9FAFB" }}>
        {isSigningUp ? "Verify Your Phone" : "Welcome Back"}
      </Text>
      <Text style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 40 }}>
        Enter the 6-digit code sent to{"\n"}
        {phoneNumber}
      </Text>
      {!isSigningUp && (
        <Text style={{ fontSize: 14, color: "#A78BFA", marginBottom: 20 }}>
          Signing you back in...
        </Text>
      )}

      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#F9FAFB" }}>
          Verification Code
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#374151",
            backgroundColor: "#1F2937",
            borderRadius: 8,
            padding: 16,
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

      <TouchableOpacity
        style={{
          backgroundColor: "#8B5CF6",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 20,
          opacity: loading || code.length !== 6 ? 0.6 : 1
        }}
        onPress={handleVerify}
        disabled={loading || code.length !== 6}
      >
        <Text style={{ color: "#F9FAFB", fontSize: 16, fontWeight: "600" }}>
          {loading ? "Verifying..." : "Verify"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} style={{ alignItems: "center" }}>
        <Text style={{ color: "#A78BFA", fontSize: 14 }}>
          Didn&apos;t receive code? Resend
        </Text>
      </TouchableOpacity>
    </View>
  );
}
