import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { whatsappBusinessAPI } from '../utils/whatsappBusinessAPI';

export default function WhatsAppSetupScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  
  const [config, setConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    webhookURL: ''
  });

  const [connectionStatus, setConnectionStatus] = useState({
    tested: false,
    success: false,
    phoneNumber: '',
    error: ''
  });

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      await whatsappBusinessAPI.initialize();
      
      const currentConfig = whatsappBusinessAPI.getConfiguration();
      if (currentConfig.hasAccessToken) {
        // Don't show actual tokens for security
        setConfig(prev => ({
          ...prev,
          accessToken: '•'.repeat(20) + ' (configured)',
          phoneNumberId: '•'.repeat(15) + ' (configured)',
          webhookVerifyToken: '•'.repeat(10) + ' (configured)'
        }));
        
        // Test connection to get phone number
        const testResult = await whatsappBusinessAPI.testConnection();
        if (testResult.success) {
          setConnectionStatus({
            tested: true,
            success: true,
            phoneNumber: testResult.phoneNumber,
            error: ''
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!config.accessToken || !config.phoneNumberId || !config.webhookVerifyToken) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      // Don't save if showing masked values
      if (config.accessToken.includes('•')) {
        Alert.alert('Info', 'Configuration is already saved. Test connection to verify.');
        return;
      }

      const result = await whatsappBusinessAPI.setupCredentials(
        config.accessToken.trim(),
        config.phoneNumberId.trim(),
        config.webhookVerifyToken.trim()
      );

      if (result.success) {
        Alert.alert(
          'Configuration Saved! ✅',
          'WhatsApp Business API has been configured successfully. You can now test the connection.',
          [
            { text: 'OK' },
            { text: 'Test Connection', onPress: () => handleTestConnection() }
          ]
        );
        
        // Reload to show masked values
        await loadCurrentConfig();
      } else {
        Alert.alert('Configuration Failed', result.error);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      
      const testResult = await whatsappBusinessAPI.testConnection();
      
      setConnectionStatus({
        tested: true,
        success: testResult.success,
        phoneNumber: testResult.phoneNumber || '',
        error: testResult.error || ''
      });

      if (testResult.success) {
        Alert.alert(
          'Connection Successful! 🎉',
          `Connected to WhatsApp Business Account\nPhone: ${testResult.phoneNumber}`,
          [
            { text: 'Great!' },
            { text: 'Send Test Message', onPress: () => handleSendTestMessage() }
          ]
        );
      } else {
        Alert.alert('Connection Failed', testResult.error);
      }
      
    } catch (error) {
      Alert.alert('Test Error', error.message);
      setConnectionStatus({
        tested: true,
        success: false,
        phoneNumber: '',
        error: error.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTestMessage = () => {
    setShowTestModal(true);
    setTestPhoneNumber('');
  };

  const sendTestMessageToNumber = async () => {
    console.log('🧪 Test message function called with number:', testPhoneNumber);
    
    if (!testPhoneNumber || !testPhoneNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter a phone number');
      return;
    }

    // Basic phone number validation
    const cleanedNumber = testPhoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleanedNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number with country code (e.g., +919106765644)');
      return;
    }

    try {
      setIsLoading(true);
      setShowTestModal(false);
      
      console.log('📤 Sending test message to:', testPhoneNumber);
      
      // Format the number - remove + and any non-digits, then ensure it starts with country code
      let formattedNumber = cleanedNumber;
      if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
        formattedNumber = '91' + formattedNumber; // Add India country code if missing
      }
      
      const testMessage = '🤖 Hello! This is a test message from your AI Assistant. The WhatsApp integration is working correctly!';
      
      console.log('🔄 Calling WhatsApp API with formatted number:', formattedNumber);
      
      const result = await whatsappBusinessAPI.sendMessage(formattedNumber, testMessage);
      
      console.log('📊 WhatsApp API result:', result);
      
      if (result.success) {
        Alert.alert(
          'Test Message Sent! ✅',
          `Message sent successfully to +${formattedNumber}\nMessage ID: ${result.messageId || 'N/A'}`,
          [
            { text: 'Awesome!' },
            { text: 'Setup Personal Assistant', onPress: () => router.push('/assistant-personality') }
          ]
        );
      } else {
        Alert.alert('Send Failed', result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('❌ Test message error:', error);
      Alert.alert('Error', 'Failed to send test message: ' + error.message);
    } finally {
      setIsLoading(false);
      setTestPhoneNumber('');
    }
  };

  const handleClearConfiguration = () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to remove all WhatsApp Business API settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const result = await whatsappBusinessAPI.clearConfiguration();
            if (result.success) {
              setConfig({
                accessToken: '',
                phoneNumberId: '',
                webhookVerifyToken: '',
                webhookURL: ''
              });
              setConnectionStatus({
                tested: false,
                success: false,
                phoneNumber: '',
                error: ''
              });
              Alert.alert('Configuration Cleared', 'WhatsApp settings have been removed.');
            }
          }
        }
      ]
    );
  };

  const openWhatsAppBusinessDocs = () => {
    Alert.alert(
      'WhatsApp Business API Setup',
      'You need to:\n\n1. Create a WhatsApp Business Account\n2. Set up a WhatsApp Business App\n3. Get your Access Token and Phone Number ID\n4. Configure webhook settings\n\nWould you like to open the official documentation?',
      [
        { text: 'Not Now' },
        { text: 'Open Docs', onPress: () => {
          // In a real app, you'd use Linking.openURL
          console.log('Would open: https://developers.facebook.com/docs/whatsapp/getting-started');
        }}
      ]
    );
  };

  return (
    <LinearGradient colors={["#25D366", "#128C7E", "#075E54"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="whatsapp" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>WhatsApp Business</Text>
        <TouchableOpacity 
          onPress={openWhatsAppBusinessDocs} 
          style={styles.helpButton}
        >
          <MaterialCommunityIcons name="help-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Connection Status Card */}
        {connectionStatus.tested && (
          <View style={[
            styles.statusCard,
            connectionStatus.success ? styles.successCard : styles.errorCard
          ]}>
            <View style={styles.statusHeader}>
              <MaterialCommunityIcons 
                name={connectionStatus.success ? "check-circle" : "alert-circle"} 
                size={24} 
                color={connectionStatus.success ? "#10B981" : "#EF4444"} 
              />
              <Text style={[
                styles.statusTitle,
                { color: connectionStatus.success ? "#10B981" : "#EF4444" }
              ]}>
                {connectionStatus.success ? 'Connected' : 'Connection Failed'}
              </Text>
            </View>
            
            {connectionStatus.success ? (
              <Text style={styles.statusText}>
                ✅ Successfully connected to WhatsApp Business
                {connectionStatus.phoneNumber && `\n📱 Phone: ${connectionStatus.phoneNumber}`}
              </Text>
            ) : (
              <Text style={styles.statusText}>
                ❌ {connectionStatus.error}
              </Text>
            )}
          </View>
        )}

        {/* Configuration Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cog" size={24} color="#128C7E" />
            <Text style={styles.cardTitle}>API Configuration</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Access Token *</Text>
            <TextInput
              style={styles.input}
              value={config.accessToken}
              onChangeText={(text) => setConfig(prev => ({ ...prev, accessToken: text }))}
              placeholder="Your WhatsApp Business API Access Token"
              placeholderTextColor="#999"
              secureTextEntry={config.accessToken.includes('•')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number ID *</Text>
            <TextInput
              style={styles.input}
              value={config.phoneNumberId}
              onChangeText={(text) => setConfig(prev => ({ ...prev, phoneNumberId: text }))}
              placeholder="Your WhatsApp Business Phone Number ID"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Webhook Verify Token *</Text>
            <TextInput
              style={styles.input}
              value={config.webhookVerifyToken}
              onChangeText={(text) => setConfig(prev => ({ ...prev, webhookVerifyToken: text }))}
              placeholder="Custom verification token for webhook"
              placeholderTextColor="#999"
              secureTextEntry={config.webhookVerifyToken.includes('•')}
            />
            <Text style={styles.helpText}>
              Used to verify incoming webhook requests from WhatsApp
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Webhook URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={config.webhookURL}
              onChangeText={(text) => setConfig(prev => ({ ...prev, webhookURL: text }))}
              placeholder="https://your-server.com/webhook"
              placeholderTextColor="#999"
              keyboardType="url"
            />
            <Text style={styles.helpText}>
              URL where WhatsApp will send message notifications
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveConfiguration}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !whatsappBusinessAPI.isConfigured() && styles.disabledButton
            ]}
            onPress={handleTestConnection}
            disabled={!whatsappBusinessAPI.isConfigured() || isTestingConnection}
          >
            <MaterialCommunityIcons name="wifi" size={20} color="#128C7E" />
            <Text style={[
              styles.secondaryButtonText,
              !whatsappBusinessAPI.isConfigured() && styles.disabledText
            ]}>
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          {connectionStatus.success && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleSendTestMessage}
            >
              <MaterialCommunityIcons name="send" size={20} color="#25D366" />
              <Text style={styles.testButtonText}>Send Test Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Setup Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information" size={24} color="#128C7E" />
            <Text style={styles.cardTitle}>Setup Instructions</Text>
          </View>

          <Text style={styles.instructionText}>
            <Text style={styles.bold}>Step 1:</Text> Create a WhatsApp Business Account at business.whatsapp.com
            {'\n\n'}
            <Text style={styles.bold}>Step 2:</Text> Set up a WhatsApp Business App in Facebook Developer Console
            {'\n\n'}
            <Text style={styles.bold}>Step 3:</Text> Get your Access Token from the app dashboard
            {'\n\n'}
            <Text style={styles.bold}>Step 4:</Text> Find your Phone Number ID in the API setup section
            {'\n\n'}
            <Text style={styles.bold}>Step 5:</Text> Create a custom verify token for webhook security
            {'\n\n'}
            <Text style={styles.bold}>Step 6:</Text> Configure webhook URL if you have a server endpoint
          </Text>

          <TouchableOpacity
            style={styles.docsButton}
            onPress={openWhatsAppBusinessDocs}
          >
            <MaterialCommunityIcons name="book-open" size={16} color="#128C7E" />
            <Text style={styles.docsButtonText}>View Official Documentation</Text>
          </TouchableOpacity>
        </View>

        {/* Clear Configuration */}
        {whatsappBusinessAPI.isConfigured() && (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearConfiguration}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Clear Configuration</Text>
          </TouchableOpacity>
        )}

        {/* Navigation */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/assistant-personality')}
          >
            <MaterialCommunityIcons name="brain" size={20} color="#128C7E" />
            <Text style={styles.navButtonText}>Setup Personality</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/contact-authorization')}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#128C7E" />
            <Text style={styles.navButtonText}>Manage Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            🔒 Your API credentials are stored securely on your device and encrypted.
            {'\n\n'}
            💡 Once configured, your AI assistant will automatically respond to authorized contacts via WhatsApp.
            {'\n\n'}
            ⚡ Test the integration thoroughly before enabling it for important conversations.
          </Text>
        </View>
      </ScrollView>

      {/* Test Message Modal */}
      <Modal
        visible={showTestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Test Message</Text>
            <Text style={styles.modalSubtitle}>
              Enter a phone number to receive a test message:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., +1234567890"
              placeholderTextColor="#9CA3AF"
              value={testPhoneNumber}
              onChangeText={setTestPhoneNumber}
              keyboardType="phone-pad"
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTestModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={sendTestMessageToNumber}
                disabled={!testPhoneNumber}
              >
                <Text style={styles.modalSendText}>Send Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#128C7E',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#128C7E',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#128C7E',
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  testButtonText: {
    fontSize: 16,
    color: '#25D366',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  docsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#128C7E',
  },
  docsButtonText: {
    fontSize: 14,
    color: '#128C7E',
    fontWeight: '500',
    marginLeft: 6,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dangerButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#128C7E',
  },
  navButtonText: {
    fontSize: 14,
    color: '#128C7E',
    fontWeight: '600',
    marginLeft: 6,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  modalSendText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
