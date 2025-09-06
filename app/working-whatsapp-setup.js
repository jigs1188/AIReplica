/**
 * WhatsApp Business API Integration - Working Implementation
 * Step-by-step setup with real connection testing
 */

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
  Linking,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkingWhatsAppSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const [setupData, setSetupData] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: 'aireplica_webhook_2024',
    testPhoneNumber: ''
  });
  
  const [connectionStatus, setConnectionStatus] = useState({
    tested: false,
    connected: false,
    phoneNumber: '',
    businessName: '',
    error: ''
  });

  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem('@whatsapp_config');
      if (stored) {
        const config = JSON.parse(stored);
        setSetupData(prev => ({ ...prev, ...config }));
        if (config.accessToken && config.phoneNumberId) {
          setCurrentStep(4); // Jump to testing step
          testExistingConnection(config);
        }
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  };

  const testExistingConnection = async (config) => {
    try {
      setTestingConnection(true);
      const result = await testWhatsAppConnection(config.accessToken, config.phoneNumberId);
      setConnectionStatus(result);
    } catch (error) {
      console.error('Error testing existing connection:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const testWhatsAppConnection = async (accessToken, phoneNumberId) => {
    try {
      // Test API access by getting phone number info
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.display_phone_number) {
        // Get business account info
        let businessName = 'WhatsApp Business';
        try {
          const businessResponse = await fetch(`https://graph.facebook.com/v18.0/${data.id}?fields=name`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const businessData = await businessResponse.json();
          if (businessData.name) businessName = businessData.name;
        } catch (e) {
          console.log('Could not fetch business name:', e);
        }

        return {
          tested: true,
          connected: true,
          phoneNumber: data.display_phone_number,
          businessName: businessName,
          error: ''
        };
      } else {
        return {
          tested: true,
          connected: false,
          phoneNumber: '',
          businessName: '',
          error: data.error?.message || 'Invalid credentials'
        };
      }
    } catch (error) {
      return {
        tested: true,
        connected: false,
        phoneNumber: '',
        businessName: '',
        error: error.message || 'Connection failed'
      };
    }
  };

  const handleTestConnection = async () => {
    if (!setupData.accessToken || !setupData.phoneNumberId) {
      Alert.alert('Missing Info', 'Please enter both Access Token and Phone Number ID');
      return;
    }

    setTestingConnection(true);
    const result = await testWhatsAppConnection(setupData.accessToken, setupData.phoneNumberId);
    setConnectionStatus(result);
    setTestingConnection(false);

    if (result.connected) {
      Alert.alert(
        '🎉 Connection Successful!',
        `Connected to: ${result.phoneNumber}\nBusiness: ${result.businessName}`,
        [{ text: 'Continue', onPress: () => setCurrentStep(5) }]
      );
    } else {
      Alert.alert('Connection Failed', result.error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setIsLoading(true);
      
      const config = {
        accessToken: setupData.accessToken,
        phoneNumberId: setupData.phoneNumberId,
        businessAccountId: setupData.businessAccountId,
        webhookVerifyToken: setupData.webhookVerifyToken,
        connectedAt: new Date().toISOString(),
        phoneNumber: connectionStatus.phoneNumber,
        businessName: connectionStatus.businessName
      };

      await AsyncStorage.setItem('@whatsapp_config', JSON.stringify(config));
      await AsyncStorage.setItem('@platform_whatsapp', JSON.stringify({
        connected: true,
        connectedAt: Date.now(),
        status: 'active',
        platform: 'WhatsApp Business'
      }));

      Alert.alert(
        '✅ WhatsApp Connected!',
        'Your WhatsApp Business account is now connected to AIReplica. You can start receiving and auto-replying to messages!',
        [
          { text: 'Test Auto-Reply', onPress: () => setCurrentStep(6) },
          { text: 'Go to Dashboard', onPress: () => router.push('/dashboard') }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!setupData.testPhoneNumber) {
      Alert.alert('Missing Info', 'Please enter a test phone number');
      return;
    }

    try {
      setIsLoading(true);
      
      const testMessage = {
        messaging_product: "whatsapp",
        to: setupData.testPhoneNumber.replace(/[^0-9]/g, ''), // Clean phone number
        type: "text",
        text: {
          body: "🤖 Hello! This is a test message from AIReplica. Your WhatsApp auto-reply is working perfectly!"
        }
      };

      const response = await fetch(`https://graph.facebook.com/v18.0/${setupData.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${setupData.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        Alert.alert(
          '✅ Test Message Sent!',
          `Test message sent successfully to ${setupData.testPhoneNumber}`,
          [{ text: 'Great!', onPress: () => router.push('/ai-replica-dashboard') }]
        );
      } else {
        Alert.alert('Test Failed', data.error?.message || 'Failed to send test message');
      }

    } catch (error) {
      Alert.alert('Error', 'Test message failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openMetaDeveloperConsole = () => {
    Linking.openURL('https://developers.facebook.com/apps/');
  };

  const openWhatsAppBusinessConsole = () => {
    Linking.openURL('https://business.facebook.com/wa/manage/phone-numbers/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>📱 Step 1: WhatsApp Business Account</Text>
            <Text style={styles.stepDescription}>
              First, you need a WhatsApp Business account and Meta Developer access.
            </Text>
            
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>✅ Requirements:</Text>
              <Text style={styles.instructionText}>• WhatsApp Business account</Text>
              <Text style={styles.instructionText}>• Meta Developer account</Text>
              <Text style={styles.instructionText}>• Business verification (optional but recommended)</Text>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={openWhatsAppBusinessConsole}>
              <Ionicons name="open-outline" size={20} color="#25D366" />
              <Text style={styles.linkButtonText}>Open WhatsApp Business Console</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentStep(2)}>
              <Text style={styles.primaryButtonText}>I Have WhatsApp Business ✓</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🔑 Step 2: Get API Credentials</Text>
            <Text style={styles.stepDescription}>
              Get your Access Token and Phone Number ID from Meta Developer Console.
            </Text>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>📋 How to get credentials:</Text>
              <Text style={styles.instructionText}>1. Go to Meta Developer Console</Text>
              <Text style={styles.instructionText}>2. Create/Select your app</Text>
              <Text style={styles.instructionText}>3. Add WhatsApp Business product</Text>
              <Text style={styles.instructionText}>4. Copy Access Token & Phone Number ID</Text>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={openMetaDeveloperConsole}>
              <Ionicons name="code-outline" size={20} color="#1877F2" />
              <Text style={styles.linkButtonText}>Open Meta Developer Console</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentStep(3)}>
              <Text style={styles.primaryButtonText}>I Have My Credentials ✓</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>⚙️ Step 3: Enter Credentials</Text>
            <Text style={styles.stepDescription}>
              Enter your WhatsApp Business API credentials below:
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Access Token *</Text>
              <TextInput
                style={styles.input}
                value={setupData.accessToken}
                onChangeText={(text) => setSetupData(prev => ({ ...prev, accessToken: text }))}
                placeholder="EAAxxxxxxxxxxxxxxxx..."
                secureTextEntry={true}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number ID *</Text>
              <TextInput
                style={styles.input}
                value={setupData.phoneNumberId}
                onChangeText={(text) => setSetupData(prev => ({ ...prev, phoneNumberId: text }))}
                placeholder="1234567890123456"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Account ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={setupData.businessAccountId}
                onChangeText={(text) => setSetupData(prev => ({ ...prev, businessAccountId: text }))}
                placeholder="1234567890123456"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentStep(4)}>
              <Text style={styles.primaryButtonText}>Test Connection →</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🧪 Step 4: Test Connection</Text>
            <Text style={styles.stepDescription}>
              Let&apos;s verify your WhatsApp Business API connection:
            </Text>

            {connectionStatus.tested && (
              <View style={[styles.statusBox, connectionStatus.connected ? styles.successBox : styles.errorBox]}>
                <Ionicons 
                  name={connectionStatus.connected ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={connectionStatus.connected ? "#10B981" : "#EF4444"} 
                />
                <View style={styles.statusContent}>
                  <Text style={[styles.statusTitle, { color: connectionStatus.connected ? "#10B981" : "#EF4444" }]}>
                    {connectionStatus.connected ? "✅ Connected!" : "❌ Connection Failed"}
                  </Text>
                  {connectionStatus.connected ? (
                    <>
                      <Text style={styles.statusText}>Phone: {connectionStatus.phoneNumber}</Text>
                      <Text style={styles.statusText}>Business: {connectionStatus.businessName}</Text>
                    </>
                  ) : (
                    <Text style={styles.statusText}>{connectionStatus.error}</Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.primaryButton, testingConnection && styles.disabledButton]} 
              onPress={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>🔍 Test Connection</Text>
              )}
            </TouchableOpacity>

            {connectionStatus.connected && (
              <TouchableOpacity style={styles.successButton} onPress={() => setCurrentStep(5)}>
                <Text style={styles.successButtonText}>Continue Setup →</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>💾 Step 5: Save Configuration</Text>
            <Text style={styles.stepDescription}>
              Your WhatsApp connection is working! Save the configuration to complete setup.
            </Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>📋 Connection Summary:</Text>
              <Text style={styles.summaryText}>✅ Phone: {connectionStatus.phoneNumber}</Text>
              <Text style={styles.summaryText}>✅ Business: {connectionStatus.businessName}</Text>
              <Text style={styles.summaryText}>✅ Webhook Token: {setupData.webhookVerifyToken}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={saveConfiguration}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>💾 Save & Connect WhatsApp</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>🚀 Step 6: Test Auto-Reply</Text>
            <Text style={styles.stepDescription}>
              Send a test message to verify everything works perfectly!
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Test Phone Number (with country code)</Text>
              <TextInput
                style={styles.input}
                value={setupData.testPhoneNumber}
                onChangeText={(text) => setSetupData(prev => ({ ...prev, testPhoneNumber: text }))}
                placeholder="+1234567890"
                keyboardType="phone-pad"
              />
              <Text style={styles.inputHelper}>Include country code (e.g., +1 for US, +44 for UK)</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]} 
              onPress={sendTestMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>📤 Send Test Message</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/ai-replica-dashboard')}>
              <Text style={styles.secondaryButtonText}>Skip Test - Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={["#25D366", "#128C7E", "#075E54"]} style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Business Setup</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{currentStep}/6</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(currentStep / 6) * 100}%` }]} />
          </View>
        </View>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backStepButton} 
              onPress={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            >
              <Ionicons name="chevron-back" size={20} color="#666" />
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 500,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  instructionBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#25D366',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  linkButtonText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  statusContent: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  summaryBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backStepText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});
