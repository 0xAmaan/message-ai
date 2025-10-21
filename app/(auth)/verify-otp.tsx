import { useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../lib/constants";

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
      console.log(
        "Full signUpAttempt:",
        JSON.stringify(signUpAttempt, null, 2),
      );

      // For phone-only authentication, Clerk often returns "missing_requirements"
      // even though phone verification is complete. We need to set the session active.
      if (signUpAttempt.createdSessionId) {
        // Set the session as active - this is critical for Clerk + Convex integration
        await setActive({ session: signUpAttempt.createdSessionId });
        console.log("Session activated successfully!");

        // Navigate to profile setup
        router.replace("/(auth)/profile-setup");
      } else if (signUpAttempt.status === "complete") {
        // Backup: if status is complete but no session ID yet, still proceed
        console.log("Sign up complete, proceeding to profile setup");
        router.replace("/(auth)/profile-setup");
      } else {
        // No session ID available - this shouldn't happen with proper configuration
        console.error("No session created. Status:", signUpAttempt.status);
        Alert.alert(
          "Verification Error",
          "Unable to complete verification. Please try again or contact support.",
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
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Phone</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{"\n"}
        {phoneNumber}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading || code.length !== 6}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
        <Text style={styles.resendText}>Didn&apos;t receive code? Resend</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 10,
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    marginTop: 20,
    alignItems: "center",
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
  },
});
