import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { COLORS } from '../../lib/constants';

export default function PhoneInputScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);

      // Phone number must be in E.164 format
      const formattedPhone = phoneNumber.startsWith('+') 
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
        pathname: '/auth/verify-otp',
        params: { phoneNumber: formattedPhone },
      });
    } catch (error: any) {
      Alert.alert('Error', error.errors?.[0]?.message || 'Failed to send code');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MessageAI</Text>
      <Text style={styles.subtitle}>
        Enter your phone number to get started
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1234567890"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          autoFocus
        />
        <Text style={styles.hint}>
          Include country code (e.g., +1 for US)
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !phoneNumber}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Code'}
        </Text>
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
    fontWeight: 'bold',
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
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
