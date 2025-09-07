import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RealWhatsAppSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  // WhatsApp setup state
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessName: '',
    autoReplyEnabled: false,
    responseStyle: 'friendly',
    customGreeting: '',
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00'
    },
    autoReplyRules: [
      { keyword: 'hi|hello|hey', response: 'Hello! Thanks for messaging. How can I help you today? 😊' },
      { keyword: 'price|cost|how much', response: 'I\'ll get you pricing information right away! One moment please.' },
      { keyword: 'thanks|thank you', response: 'You\'re welcome! Happy to help! 🙌' }
    ]
  });

  const countryCodes = [
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+1', country: 'Canada', flag: '��' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' }
  ];

  const responseStyles = [
    { id: 'professional', name: 'Professional', desc: 'Formal and business-like', emoji: '💼' },
    { id: 'friendly', name: 'Friendly', desc: 'Warm and approachable', emoji: '😊' },
    { id: 'casual', name: 'Casual', desc: 'Relaxed and informal', emoji: '😎' },
    { id: 'helpful', name: 'Helpful', desc: 'Solution-focused', emoji: '🤝' }
  ];

  // Step 1: Phone Number Entry
  const renderPhoneNumberStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="phone-check" size={48} color="#25D366" />
        <Text style={styles.stepTitle}>Enter Your WhatsApp Number</Text>
        <Text style={styles.stepDescription}>
          We'll send an OTP to verify this number and connect it to auto-reply
        </Text>
      </View>

      <View style={styles.phoneInputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Country Code</Text>
          <TouchableOpacity 
            style={styles.countryCodeSelector}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Ionicons name="chevron-down" size={20} color="#25D366" />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>
      </View>      {/* Country Code Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCountryPicker(false);
                  setSearchCountry('');
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                value={searchCountry}
                onChangeText={setSearchCountry}
                autoCapitalize="none"
              />
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            </View>
            
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={true}>
              {countryCodes
                .filter(country => {
                  const searchTerm = searchCountry.toLowerCase().trim();
                  return searchTerm === '' || 
                    country.country.toLowerCase().includes(searchTerm) ||
                    country.code.includes(searchTerm) ||
                    country.code.replace('+', '').includes(searchTerm);
                })
                .map((country, index) => (
                <TouchableOpacity
                  key={`${country.code}-${index}`}
                  style={[
                    styles.countryItem,
                    countryCode === country.code && styles.selectedCountryItem
                  ]}
                  onPress={() => {
                    setCountryCode(country.code);
                    setShowCountryPicker(false);
                    setSearchCountry('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.country}</Text>
                  <Text style={styles.countryCodeText}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Text style={styles.phoneExample}>
        Example: {countryCode === '+91' ? '(555) 123-4567' : '1234567890'}
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, !phoneNumber && styles.disabledButton]}
        onPress={sendOTP}
        disabled={!phoneNumber || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Send OTP</Text>
            <MaterialCommunityIcons name="send" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={20} color="#25D366" />
        <Text style={styles.securityText}>
          Your number is encrypted and secure. We only use it for WhatsApp auto-reply setup.
        </Text>
      </View>
    </View>
  );

  // Step 2: OTP Verification
  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="message-text-lock" size={48} color="#25D366" />
        <Text style={styles.stepTitle}>Verify OTP</Text>
        <Text style={styles.stepDescription}>
          Enter the 6-digit code sent to {countryCode} {phoneNumber}
        </Text>
      </View>

      <View style={styles.otpContainer}>
        <TextInput
          style={styles.otpInput}
          placeholder="Enter 6-digit OTP"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !otpCode && styles.disabledButton]}
        onPress={verifyOTP}
        disabled={!otpCode || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Verify & Connect</Text>
            <MaterialCommunityIcons name="check-circle" size={20} color="white" /> 
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={resendOTP}>
        <Text style={styles.resendText}>Didn't receive OTP? Resend</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 3: WhatsApp Configuration
  const renderConfigStep = () => (
    <ScrollView style={styles.configContainer}>
      <View style={styles.stepHeader}>
        <MaterialCommunityIcons name="robot" size={48} color="#25D366" />
        <Text style={styles.stepTitle}>Configure Auto-Reply</Text>
        <Text style={styles.stepDescription}>
          Set up how your AI assistant will respond to WhatsApp messages
        </Text>
      </View>

      {/* Business Name */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Business/Personal Name</Text>
        <TextInput
          style={styles.configInput}
          placeholder="How should people know you?"
          value={whatsappConfig.businessName}
          onChangeText={(text) => setWhatsappConfig(prev => ({ ...prev, businessName: text }))}
        />
      </View>

      {/* Response Style */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Response Style</Text>
        <View style={styles.styleGrid}>
          {responseStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                whatsappConfig.responseStyle === style.id && styles.selectedStyle
              ]}
              onPress={() => setWhatsappConfig(prev => ({ ...prev, responseStyle: style.id }))}
            >
              <Text style={styles.styleEmoji}>{style.emoji}</Text>
              <Text style={styles.styleName}>{style.name}</Text>
              <Text style={styles.styleDesc}>{style.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Greeting */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Custom Greeting Message</Text>
        <TextInput
          style={styles.textAreaInput}
          placeholder="Hi! Thanks for messaging. I'll get back to you soon! 😊"
          value={whatsappConfig.customGreeting}
          onChangeText={(text) => setWhatsappConfig(prev => ({ ...prev, customGreeting: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Auto-Reply Rules */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Auto-Reply Rules</Text>
        {whatsappConfig.autoReplyRules.map((rule, index) => (
          <View key={index} style={styles.ruleCard}>
            <Text style={styles.ruleKeyword}>When message contains: &quot;{rule.keyword}&quot;</Text>
            <Text style={styles.ruleResponse}>Reply: {rule.response}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={completeSetup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Complete Setup</Text>
            <MaterialCommunityIcons name="check-all" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // Step 4: Success & Testing
  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successHeader}>
        <LinearGradient
          colors={['#25D366', '#128C7E']}
          style={styles.successIcon}
        >
          <MaterialCommunityIcons name="check-circle" size={48} color="white" />
        </LinearGradient>
        <Text style={styles.successTitle}>WhatsApp Auto-Reply Active! 🎉</Text>
        <Text style={styles.successDescription}>
          Your number {countryCode} {phoneNumber} is now connected and ready for auto-replies
        </Text>
      </View>

      <View style={styles.testingSection}>
        <Text style={styles.testingTitle}>Test Your Setup:</Text>
        
        <View style={styles.testCard}>
          <MaterialCommunityIcons name="message-text" size={24} color="#25D366" />
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>Send a Test Message</Text>
            <Text style={styles.testDesc}>Ask a friend to send "Hi" to your number</Text>
          </View>
        </View>

        <View style={styles.testCard}>
          <MaterialCommunityIcons name="history" size={24} color="#25D366" />
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>Check Response History</Text>
            <Text style={styles.testDesc}>View all auto-replies in the dashboard</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/dashboard')}
      >
        <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
        <MaterialCommunityIcons name="view-dashboard" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={startTesting}
      >
        <Text style={styles.secondaryButtonText}>Start Live Testing</Text>
        <MaterialCommunityIcons name="play-circle" size={20} color="#25D366" />
      </TouchableOpacity>
    </View>
  );

  // Functions
  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const fullNumber = countryCode + phoneNumber.replace(/\D/g, '');
      
      // Call your backend to initiate WhatsApp Business API verification
      const response = await fetch('http://localhost:3002/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullNumber,
          userId: auth.currentUser?.uid
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setCurrentStep(2);
        Alert.alert('OTP Sent!', `Verification code sent to ${fullNumber} via WhatsApp`);
      } else {
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          otpCode,
          phoneNumber: countryCode + phoneNumber.replace(/\D/g, ''),
          userId: auth.currentUser?.uid
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsVerified(true);
        setCurrentStep(3);
        
        // Store verified number
        await AsyncStorage.setItem('whatsapp_verified_number', countryCode + phoneNumber);
        Alert.alert('Verified!', 'Your WhatsApp number is now connected');
      } else {
        throw new Error(result.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!whatsappConfig.businessName.trim()) {
      Alert.alert('Error', 'Please enter a business/personal name');
      return;
    }

    setIsLoading(true);
    try {
      const setupData = {
        phoneNumber: countryCode + phoneNumber,
        userId: auth.currentUser?.uid,
        config: whatsappConfig,
        verificationId
      };

      const response = await fetch('http://localhost:3002/api/whatsapp/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      const result = await response.json();
      
      if (result.success) {
        await AsyncStorage.setItem('whatsapp_auto_reply_config', JSON.stringify(whatsappConfig));
        setCurrentStep(4);
      } else {
        throw new Error(result.error || 'Setup failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = () => {
    sendOTP();
  };

  const startTesting = () => {
    router.push('/whatsapp-live-test');
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Real WhatsApp Setup</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{currentStep}/4</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderPhoneNumberStep()}
          {currentStep === 2 && renderOTPStep()}
          {currentStep === 3 && renderConfigStep()}
          {currentStep === 4 && renderSuccessStep()}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e9ecef',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#25D366',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    width: '100%',
    gap: 12,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25D366',
    marginBottom: 8,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginRight: 12,
    minWidth: 85,
    borderWidth: 2,
    borderColor: '#25D366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#25D366',
    marginRight: 6,
  },
  phoneInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneExample: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  otpContainer: {
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
    width: '100%',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#25D366',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  resendButton: {
    marginTop: 20,
    padding: 12,
  },
  resendText: {
    color: '#25D366',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
    color: '#128C7E',
    fontSize: 14,
    lineHeight: 20,
  },
  configContainer: {
    flex: 1,
  },
  configSection: {
    marginBottom: 24,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  configInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textAreaInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyle: {
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.05)',
  },
  styleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  styleDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ruleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ruleKeyword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25D366',
    marginBottom: 8,
  },
  ruleResponse: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  testingSection: {
    width: '100%',
    marginBottom: 32,
  },
  testingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testInfo: {
    flex: 1,
    marginLeft: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDesc: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 35,
    top: 12,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedCountryItem: {
    backgroundColor: '#e7f3ff',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#25D366',
  },
});
