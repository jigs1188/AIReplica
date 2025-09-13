import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApiService } from '../utils/networkUtils';
import { DEV_MODE, TEST_OTP, devVerifyOTP } from '../utils/devWhatsAppHelper';

export default function DetailedWhatsAppSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your WhatsApp phone number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Sending OTP to:', phoneNumber);
      const result = await ApiService.sendWhatsAppOTP(phoneNumber, 'current_user_id');
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setOtpSent(true);
        setCurrentStep(2);
        Alert.alert(
          'OTP Sent Successfully!', 
          `Check your WhatsApp messages on ${phoneNumber} for the verification code`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('WhatsApp OTP Error:', error);
      Alert.alert('Connection Error', 'Failed to connect to WhatsApp service. Please ensure the backend services are running.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Verifying OTP:', otpCode);
      
      // Development mode bypass for testing
      if (__DEV__ && devVerifyOTP(otpCode, phoneNumber)) {
        console.log('🧪 DEV MODE: OTP verification bypassed');
        setCurrentStep(3);
        Alert.alert('Success! (Dev Mode)', 'WhatsApp connected successfully! Note: This is using development mode bypass.');
        return;
      }
      
      const result = await ApiService.verifyWhatsAppOTP(
        verificationId,
        otpCode,
        phoneNumber,
        'current_user_id'
      );
      
      if (result.success) {
        setCurrentStep(3);
        Alert.alert('Success!', 'WhatsApp connected successfully! Your AI auto-replies are now active.');
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('WhatsApp Verification Error:', error);
      Alert.alert('Connection Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="whatsapp" size={80} color="#25D366" />
      <Text style={styles.stepTitle}>Connect WhatsApp Business</Text>
      <Text style={styles.stepDescription}>
        Enter your WhatsApp Business phone number to receive a verification code
      </Text>
      
      <View style={styles.phoneInputContainer}>
        <MaterialCommunityIcons name="phone" size={20} color="#25D366" />
        <TextInput
          style={styles.phoneInput}
          placeholder="Enter phone number (e.g., +919106764653)"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <Text style={styles.noteText}>
        📱 Make sure this number is associated with your WhatsApp Business account
      </Text>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#25D366' }]}
        onPress={sendOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="send" size={20} color="white" />
            <Text style={styles.actionButtonText}>Send Verification Code</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="message-text" size={80} color="#25D366" />
      <Text style={styles.stepTitle}>Verify Your Number</Text>
      <Text style={styles.stepDescription}>
        Enter the verification code sent to {phoneNumber}
      </Text>

      <View style={styles.otpInputContainer}>
        <MaterialCommunityIcons name="key" size={20} color="#25D366" />
        <TextInput
          style={styles.otpInput}
          placeholder="Enter 6-digit code"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />
      </View>

      <Text style={styles.noteText}>
        📱 Check your WhatsApp messages for the verification code
        {__DEV__ && (
          <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>
            {'\n\n🧪 DEV MODE: Use code "' + TEST_OTP + '" if OTP not received'}
          </Text>
        )}
      </Text>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#25D366' }]}
        onPress={verifyOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Verify & Connect</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={() => {
          setCurrentStep(1);
          setOtpSent(false);
          setOtpCode('');
        }}
      >
        <Text style={styles.resendButtonText}>← Back to phone number</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
      <Text style={styles.stepTitle}>WhatsApp Connected!</Text>
      <Text style={styles.stepDescription}>
        Your AI auto-replies are now active on {phoneNumber}
      </Text>

      <View style={styles.successCard}>
        <Text style={styles.successTitle}>🎉 You&apos;re all set!</Text>
        <Text style={styles.successText}>
          • Your friends will receive AI-powered responses
        </Text>
        <Text style={styles.successText}>
          • You can customize AI behavior in Settings
        </Text>
        <Text style={styles.successText}>
          • Test the system with a friend&apos;s message
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
        onPress={() => router.push('/dashboard')}
      >
        <MaterialCommunityIcons name="home" size={20} color="white" />
        <Text style={styles.actionButtonText}>Return to Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => router.push('/test-center')}
      >
        <Text style={styles.testButtonText}>Test AI Replies</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#25D366', '#128C7E']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WhatsApp Setup</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {currentStep}/3</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  stepIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 30,
    marginVertical: 10,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  otpInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    letterSpacing: 4,
  },
  noteText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    width: '100%',
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    width: '100%',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
});
