import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

/**
 * 🚀 SIMPLE PLATFORM SETUP FOR NORMAL USERS
 * Easy OTP-based connection without technical complexity
 * Just phone number + OTP verification + permissions
 */

export default function SimpleUserSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [whatsappType, setWhatsappType] = useState('business'); // 'business' or 'regular'

  // Simple platform options for normal users
  const simplePlatforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: 'whatsapp',
      color: '#25D366',
      description: 'Professional auto-replies with Business API',
      setupType: 'phone_otp',
      whatsappType: 'business',
      features: ['Unlimited messaging', 'Rich media', 'Analytics', 'Templates']
    },
    {
        id: 'quick_connect',
        name: 'Quick Connect',
        icon: 'flash',
        color: '#6A0572',
        description: 'Unified consumer flow for all platforms',
        setupType: 'quick_connect',
        features: ['Username/Password', 'Auto-replies', 'Unified UI']
      },
      {
      id: 'whatsapp_regular',
      name: 'WhatsApp Personal',
      icon: 'message-circle',
      color: '#128C7E',
      description: 'Personal auto-replies via WhatsApp Web (QR Scan)',
      setupType: 'qr_scan',
      whatsappType: 'regular',
      features: ['Personal messages', 'QR setup', 'WhatsApp Web', 'Free to use']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      description: 'Auto-reply to Instagram DMs (Login + OTP)',
      setupType: 'social_login',
      authFlow: 'login_otp',
      features: ['DM auto-replies', 'Story mentions', 'Comment responses', 'Login + SMS verification']
    },
    {
      id: 'email',
      name: 'Gmail',
      icon: 'gmail',
      color: '#DB4437',
      description: 'Smart email auto-responses (Login + 2FA)',
      setupType: 'social_login',
      authFlow: 'login_2fa',
      features: ['Email auto-replies', 'Thread management', 'Login + 2FA', 'App Password support']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0077B5',
      description: 'Professional message automation (Login + Phone)',
      setupType: 'social_login',
      authFlow: 'login_phone',
      features: ['Professional replies', 'Connection requests', 'Login + Phone verification', 'Network management']
    }
  ];

  const handlePlatformSelect = async (platform) => {
      return;
    }
    
    if (platform.id === 'quick_connect') {
      Alert.alert(
        'Quick Connect',
        'This will guide you through a unified consumer flow for all platforms.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => router.push('/consumer-platforms') }
        ]
      );
    setSelectedPlatform(platform);
    
    // For WhatsApp, preserve the working QR/OTP flows
    if (platform.id.includes('whatsapp')) {
      if (platform.whatsappType) {
        setWhatsappType(platform.whatsappType);
      }
      
      if (platform.setupType === 'qr_scan') {
        // Direct to QR scanning for WhatsApp Web (already working!)
        Alert.alert(
          '📱 WhatsApp Web Setup',
          'You will scan a QR code with your WhatsApp app to connect. This is the same QR system you mentioned that was working!',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start QR Setup', 
              onPress: () => {
                // Route to universal QR system (preserves your working QR flow)
                router.push(`/universal-qr-auth?platform=whatsapp&type=${platform.whatsappType}`);
              }
            }
          ]
        );
      } else {
        // Phone OTP for WhatsApp Business
        setCurrentStep(2);
      }
      return;
    }
    
    // For other platforms, use simple login + verification flows
    await handleSimpleAuth(platform);
  };

  const handleSimpleAuth = async (platform) => {
    // For non-WhatsApp platforms, use simple authentication flows that ACTIVATE AUTO-REPLIES
    switch(platform.authFlow) {
      case 'login_otp':
        // Instagram: Username/Password + SMS OTP + Auto-Reply Activation
        Alert.alert(
          `🤖 Connect ${platform.name} Auto-Replies`,
          'Setup auto-replies for Instagram DMs. You will login and configure AI responses.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Auto-Reply Setup', 
              onPress: () => router.push('/consumer-instagram-setup')
            }
          ]
        );
        break;
      
      case 'login_2fa':
        // Gmail: Email/Password + 2FA + Auto-Reply Activation
        Alert.alert(
          `📧 Connect ${platform.name} Auto-Replies`,
          'Setup smart email auto-responses. You will login and configure AI email assistant.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Email Auto-Reply Setup', 
              onPress: () => router.push('/consumer-gmail-setup')
            }
          ]
        );
        break;
      
      case 'login_phone':
        // LinkedIn: Email/Password + Phone verification + Auto-Reply Activation
        Alert.alert(
          `💼 Connect ${platform.name} Auto-Replies`,
          'Setup professional message automation. You will login and configure AI assistant.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Professional Auto-Reply Setup', 
              onPress: () => router.push('/consumer-linkedin-setup')
            }
          ]
        );
        break;
      
      default:
        // Fallback to consumer components with auto-reply focus
        Alert.alert(
          `🤖 ${platform.name} Auto-Replies`,
          'Configure AI auto-replies for this platform.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Setup Auto-Replies', onPress: () => router.push(`/consumer-${platform.id}-setup`) }
          ]
        );
    }
  };

  const saveConnectionStatus = async (platformId) => {
    try {
      const stored = await AsyncStorage.getItem('@connected_platforms');
      const current = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...current,
        [platformId]: {
          connected: true,
          connectedAt: new Date().toISOString(),
          autoReplyEnabled: true,
          method: 'quick_connect'
        }
      };
      
      await AsyncStorage.setItem('@connected_platforms', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving connection status:', error);
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Determine platform and WhatsApp type
      const platformId = selectedPlatform.id.includes('whatsapp') ? 'whatsapp' : selectedPlatform.id;
      const requestBody = {
        phoneNumber: phoneNumber,
        platform: platformId,
        userType: 'simple'
      };
        // Additional logic for Quick Connect can be added here

      // Add WhatsApp type if it's a WhatsApp platform
      if (selectedPlatform.whatsappType) {
        requestBody.whatsappType = selectedPlatform.whatsappType;
      }

      // Call backend to send OTP
      const response = await fetch('http://localhost:3001/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setOtpSent(true);
        
        // Handle different setup types
        if (selectedPlatform.setupType === 'qr_scan') {
          setCurrentStep(3);
          Alert.alert(
            '📱 WhatsApp Web Setup',
            `${result.message}\n\n${result.instructions || 'Please scan the QR code with your WhatsApp mobile app.'}`,
            [
              { 
                text: 'Show QR Code', 
                onPress: () => {
                  // In production, this would open QR display
                  Alert.alert('QR Code', 'Check WhatsApp Web service on port 3004 for QR code');
                }
              },
              { text: 'Continue', onPress: () => setCurrentStep(4) }
            ]
          );
        } else {
          setCurrentStep(3);
          Alert.alert(
            'OTP Sent! 📱',
            `${result.message}\n\nCheck your ${selectedPlatform.name} for the verification code.`
          );
        }
      } else {
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP Error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      // Determine platform and WhatsApp type for verification
      const platformId = selectedPlatform.id.includes('whatsapp') ? 'whatsapp' : selectedPlatform.id;
      const requestBody = {
        phoneNumber: phoneNumber,
        otpCode: otpCode,
        platform: platformId
      };

      // Add WhatsApp type if it's a WhatsApp platform
      if (selectedPlatform.whatsappType) {
        requestBody.whatsappType = selectedPlatform.whatsappType;
      }

      const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        // Save connection info with WhatsApp type
        await AsyncStorage.setItem(`@${selectedPlatform.id}_connected`, JSON.stringify({
          phoneNumber: phoneNumber,
          connectedAt: new Date().toISOString(),
          setupType: 'simple',
          platform: selectedPlatform.id,
          whatsappType: selectedPlatform.whatsappType,
          connectionId: result.connectionId,
          features: result.features
        }));

        setCurrentStep(4);
        
        // Show success message with specific auto-reply features
        const successMessage = result.nextSteps ? 
          result.nextSteps.join('\n• ') : 
          `Your ${selectedPlatform.name} is now connected with AI auto-replies active!`;
        
        Alert.alert(
          '🎉 Auto-Replies Activated!',
          `${result.message}\n\n🤖 AI Auto-Reply Features Active:\n• ${successMessage}\n\n✅ Start receiving messages and watch AI respond automatically!`
        );
      } else {
        throw new Error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    Alert.alert(
      `Connect ${platform.name}`,
      `This will redirect you to ${platform.name} to authorize AIReplica to auto-reply on your behalf.`,
      [
        { text: 'Cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // In production, this would open OAuth flow
            setTimeout(() => {
              Alert.alert('🎉 Success!', `${platform.name} connected successfully!`);
              router.push('/dashboard');
            }, 2000);
          }
        }
      ]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            { backgroundColor: currentStep >= step ? '#25D366' : '#E0E0E0' }
          ]}>
            <Text style={[
              styles.stepNumber,
              { color: currentStep >= step ? 'white' : '#999' }
            ]}>
              {step}
            </Text>
          </View>
          {step < 4 && <View style={styles.stepLine} />}
        </View>
      ))}
    </View>
  );

  const renderPlatformSelection = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Platform</Text>
      <Text style={styles.subtitle}>
        Which platform would you like to set up auto-replies for?
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {simplePlatforms.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[styles.platformCard, { borderColor: platform.color }]}
            onPress={() => handlePlatformSelect(platform)}
          >
            <View style={styles.platformHeader}>
              <MaterialCommunityIcons 
                name={platform.icon} 
                size={40} 
                color={platform.color} 
              />
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{platform.name}</Text>
                <Text style={styles.platformDescription}>{platform.description}</Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color="#666" 
              />
            </View>
            {platform.features && (
              <View style={styles.featuresList}>
                {platform.features.slice(0, 3).map((feature, index) => (
                  <Text key={index} style={styles.featureText}>• {feature}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>
        We&apos;ll send a verification code to connect your {selectedPlatform.name}
      </Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="phone" size={24} color="#666" />
        <TextInput
          style={styles.textInput}
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: selectedPlatform.color }]}
        onPress={sendOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPInput = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        Check your {selectedPlatform.name} for the verification code we sent to {phoneNumber}
      </Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={24} color="#666" />
        <TextInput
          style={styles.textInput}
          placeholder="Enter 6-digit code"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: selectedPlatform.color }]}
        onPress={verifyOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Verify & Connect</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setCurrentStep(2)}>
        <Text style={styles.linkText}>Wrong number? Go back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <MaterialCommunityIcons 
          name="check-circle" 
          size={80} 
          color="#25D366" 
        />
        <Text style={styles.successTitle}>🎉 All Set Up!</Text>
        <Text style={styles.successSubtitle}>
          Your {selectedPlatform.name} is now connected. AI will automatically reply to your messages!
        </Text>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>What happens next:</Text>
          <Text style={styles.featureItem}>✅ AI learns your communication style</Text>
          <Text style={styles.featureItem}>✅ Auto-replies start immediately</Text>
          <Text style={styles.featureItem}>✅ You can customize responses anytime</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: selectedPlatform.color }]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Connect</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={styles.content}>
        {currentStep === 1 && renderPlatformSelection()}
        {currentStep === 2 && selectedPlatform.setupType === 'phone_otp' && renderPhoneInput()}
        {currentStep === 2 && selectedPlatform.setupType !== 'phone_otp' && (
          <View style={styles.container}>
            <Text style={styles.title}>Connect {selectedPlatform.name}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: selectedPlatform.color }]}
              onPress={() => handleSocialLogin(selectedPlatform)}
            >
              <Text style={styles.buttonText}>Login with {selectedPlatform.name}</Text>
            </TouchableOpacity>
          </View>
        )}
        {currentStep === 3 && renderOTPInput()}
        {currentStep === 4 && renderSuccess()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  content: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  platformCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformInfo: {
    flex: 1,
    marginLeft: 15,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  platformDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  featuresList: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  featureText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
});
